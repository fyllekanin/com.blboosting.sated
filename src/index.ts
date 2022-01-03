import { Guilds } from './common/constants/guilds';
import { ICommand } from './interface/command.interface';
import { Client, Intents, Collection } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { setup } from './services/spreadsheet';
import * as fs from 'fs';
import { Roles } from './common/constants/guildroles.constants';
import { Channels } from './common/constants/channels.enum';
import fullPermissions from './permissions/slashCommands';
require('dotenv').config();

const intents = new Intents(Number(process.env.INTENTS));
const client = new Client({
  intents,
  restTimeOffset: 0,
});
const clientCommands = new Collection();

const commandFiles = fs.readdirSync('./commands');

for (const file of commandFiles) {
  if (file.endsWith('.js')) {
    registerCommand(file);
  } else {
    const commandSubFiles = fs.readdirSync(`./commands/${file}`);
    for (const subFile of commandSubFiles) {
      registerCommand(`${file}/${subFile}`);
    }
  }
}

const slashCommandFiles = fs.readdirSync('./commands-slash-register');
const commands: JSON[] = [];

for (const file of slashCommandFiles) {
  if (file.endsWith('.js')) {
    const command = require(`./commands-slash-register/${file}`);
    commands.push(command.toJSON());
  } else {
    const commandSubFiles = fs.readdirSync(`./commands-slash-register/${file}`);
    for (const subFile of commandSubFiles) {
      const command = require(`./commands-slash-register/${subFile}`);
      commands.push(command.toJSON());
    }
  }
}

function registerCommand(path: string) {
  const command = require(`./commands/${path}`);
  console.log(`registered command: ${command.name}`);
  clientCommands.set(command.name, command);
}

client
  .login(process.env.TOKEN)
  .then(async () => {
    const guilds = Array.from(Object.entries(Guilds));
    for (const [guildName, guildId] of guilds) {
      try {
        console.log(
          `Started refreshing application (/) commands for ${guildName}.`
        );
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
        const clientId = client.user.id;

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error(error);
      }
    }
  })
  .catch(console.error);

(() => {
  setup();
})();

const loadGuildCommands = async () => {
  const guilds = Array.from(Object.entries(Guilds));
  for (const [guildName, guildId] of guilds) {
    console.log(`Saving slashcommands and permissions for ${guildName}`);

    const guild = client.guilds.cache.get(guildId);

    const guildCommands = await guild.commands.fetch();

    const slashcommands: { [key: string]: string } = {};
    guildCommands.forEach((command) => {
      slashcommands[command.name] = command.id;
    });

    const data = JSON.stringify(slashcommands, null, 2);
    fs.writeFile('./JSON/slashcommands.json', data, (err: any) => {
      if (err) throw err;
      console.log('Data written to slashcommands file');
    });

    await guild?.commands.permissions.set({ fullPermissions });
  }
};

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  // if (message.type === "CHANNEL_PINNED_MESSAGE") await message.delete();

  if (message.author.bot && message.author.id !== '905449848424251402') return;

  if (!message.content.startsWith(process.env.PREFIX)) return;

  const cleanContent = message.content
    .slice(process.env.PREFIX.length)
    .trim()
    .split(/ +/g);
  const cmd = cleanContent[0];
  const args = cleanContent.slice(1);

  if (cmd.length === 0) return;

  const command = (clientCommands.get(cmd) ||
    clientCommands.find(
      (a: ICommand) => a.aliases && a.aliases.includes(cmd)
    )) as ICommand;

  if (command) {
    command.run({ client: client, message: message, args: args });
  }
});

const boostCommands = require('./commands-slash-handle/boostCommands');
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    switch (interaction.commandName) {
      case 'boost':
        await boostCommands(client, interaction);
        break;
    }
  }
});

const mythicPlusSignups = require('./events/reaction-add/mplusSignup');
client.on('messageReactionAdd', async (messageReaction, user) => {
  const message = messageReaction.message;
  if (user.bot && message.author.id === client.user.id) return;
  const channel = message.channel;
  user = message.guild.members.cache.get(user.id);
  let emoji = messageReaction.emoji.id;
  if (!emoji) {
    emoji = messageReaction.emoji.name;
    if (!emoji) {
      emoji = messageReaction.emoji;
    }
  }

  switch (message.channel.parentId) {
    case channels['On-Going Boosts']:
      await mythicPlusSignups(client, message, channel, emoji, user);
      break;
    default:
      break;
  }
});

const mythicPlusWithdraw = require('./events/reaction-remove/mplusWithdraw');
client.on('messageReactionRemove', async (messageReaction, user) => {
  const message = messageReaction.message;
  if (user.bot && message.author.id !== client.user.id) return;
  const channel = message.channel;
  user = message.guild.members.cache.get(user.id);
  let emoji = messageReaction.emoji.id;
  if (emoji === null) {
    emoji = messageReaction.emoji.name;
  }

  switch (message.channel.parentId) {
    case channels['On-Going Boosts']:
      await mythicPlusWithdraw(client, message, channel, emoji, user);
      break;
    default:
      break;
  }
});

client.on('raw', async (packet) => {
  // We don't want this to run on unrelated packets
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t))
    return;
  // Grab the channel to check the message from
  const channel = client.channels.cache.get(packet.d.channel_id);
  // There's no need to emit if the message is cached, because the event will fire anyway for that
  if (channel.messages.cache.has(packet.d.message_id)) return;
  // Since we have confirmed the message is not cached, let's fetch it
  channel.messages.fetch(packet.d.message_id).then((message) => {
    // Emojis can have identifiers of name:id format, so we have to account for that case as well
    const emoji = packet.d.emoji.id
      ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
      : packet.d.emoji.name;
    // This gives us the reaction we need to emit the event properly, in top of the message object
    // const reaction = message.reactions.get(emoji);
    // Adds the currently reacting user to the reaction's users collection.
    // if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
    // Check which type of event it is before emitting
    const messageReaction = {
      message: message,
      emoji: emoji,
    };

    client.users.fetch(packet.d.user_id).then((user) => {
      if (packet.t === 'MESSAGE_REACTION_ADD') {
        client.emit('messageReactionAdd', messageReaction, user);
      }
      if (packet.t === 'MESSAGE_REACTION_REMOVE') {
        client.emit('messageReactionRemove', messageReaction, user);
      }
    });
  });
});