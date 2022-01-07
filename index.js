/* eslint-disable no-mixed-spaces-and-tabs */
const { Client, Collection, MessageActionRow, MessageSelectMenu, Intents, MessageEmbed } = require('discord.js');
const dotenv = require('dotenv').config();
const axios = require('axios');
const Sheet = require('./spreadsheet');
const fs = require('fs');
// const applyMplus = require('./events/reactionAdd/applyMPlus');
// const applyRaid = require('./events/reactionAdd/applyRaid');
// const applyRaidRemove = require('./events/reactionRemove/applyRaid');
// const applyPvp = require('./events/reactionAdd/applyPvp');
// const thresholds = require('./thresholds.json')

const selectMplus = require('./interactions/selectmenus/applyMplus.js')
const applyMplusHandle = require('./events/buttonClick/mplusApps.js')

const selectRaid = require('./interactions/selectmenus/applyRaid.js')

// const emotes = require('./JSON/emotes.json');
const channels = require('./JSON/channels.json');
const bannedRios = require('./JSON/banned-rios.json');

const rolesCheck = ["Horde", "Alliance", "Member"]

const intents = new Intents(32767)

const client = new Client({ intents, restTimeOffset: 0 });

client.commands = new Collection();

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

function registerCommand(path) {
	const command = require(`./commands/${path}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	console.log(`name: ${command.name}`);
	client.commands.set(command.name, command);
}

client.login(process.env.TOKEN).catch(console.error);

client.on('ready', async () => {
	// Threshold tracker
	// await Sheet.fetchThresholds()
	// setInterval(async () => {
	// 	await Sheet.fetchThresholds()
	// }, 3600000)

	const channel = client.channels.cache.get('861197578489561088')
	const embed = new MessageEmbed()
		.setColor('#DD0044')

		.setTitle('Requirements')
		.addField('Mythic Plus', '<@&880439861172133919>\n<@&845679014261555220>\n<@&845679304380645396>\n<@&845679387147370526>', true)
		.addField('Requirement', '2800 RIO\n2200 RIO\n1900 RIO\n1600 RIO', true)
		.addField('Allowed To Boost', '`+16` and above\nUp to `+15`\nUp to `+13`\nUp to `+9`', true)

		.addField('Raid', '<@&845306764022906901>', true)
		.addField('Requirement', '90+% Average parse', true)
		.addField('Allowed To Boost', 'Inhouse `Heroic` raids', true)

		.addField('Advertiser', '<@&854453869214957569>', true)
		.addField('Requirement', 'Exclusive to <:BLBRound:880513151920115742>', true)
		.addField('\u200b', '\u200b', true)

		.addField('PVP', '<@&880513929053339658>', true)
		.addField('Requirement', '2400 Rating', true)
		.addField('Allowed To Boost', '2v2 | 3v3', true)

	const row = new MessageActionRow().addComponents(
		new MessageSelectMenu()
			.setCustomId('applications')
			.setPlaceholder('What do you wish to apply for?')
			// .setDisabled()
			.setMaxValues(1)
			.addOptions([
				{
					label: 'Mythic Plus Booster',
					value: 'mplus',
					emoji: '<:keystone:847886091859001414>'
				},
				{
					label: 'Raid Booster',
					value: 'raid',
					emoji: '<:raid:849352885384118273>',
				},
				{
					label: 'Advertiser',
					value: 'advertiser',
					emoji: '<:advertiser:856856187978776626>'
				},
				{
					label: 'PVP Booster',
					value: 'pvp',
					emoji: '<:pvp:878376568249012234>'
				},
				{
					label: 'Misc Booster',
					value: 'misc',
				},
				{
					label: 'Raid Leader',
					value: 'raidleader',
					emoji: '<:raid:849352885384118273>'
				},
			])
	)

	const message = await channel.messages.fetch('878647857211662377')
	message.edit({ embeds: [embed], components: [row] })

	console.log(`Logged in as ${client.user.tag}!\nhttps://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`);
});

client.on('messageCreate', async message => {

	const content = commandlessFeatures(message);

	if (message.channel.id === '861197578489561088' && !message.author.bot) message.delete()

	if (message.type === "PINS_ADD") message.delete();

	if (message.author.bot) return

	if (!content.startsWith(process.env.PREFIX)) return;

	const cleanContent = content.slice(config.PREFIX.length).trim().split(/ +/g);
	const cmd = cleanContent[0];
	const args = cleanContent.slice(1);

	if (cmd.length === 0) return;

	const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));

	if (command) {
		command.run(client, message, args);
	}

});

// Sheet.setup();

function commandlessFeatures(message) {
	let content = message.content;

	switch (message.channel.id) {
		case channels['apply-mplus']:
		case channels['apply-mplus-inhouse']:
			if (!message.author.bot && content.startsWith('https://raider.io/characters/')) {
				if (bannedRios.findIndex(banned => banned === content) > -1) {
				    return content;	
				}
				content = `!raiderIoUpdate ${content}`;
			}
			break;
		case channels['apply-raid']:
		case channels['apply-raid-inhouse']:
		case channels['apply-curve']:
		case channels['apply-curve-inhouse']:
		case channels['apply-raider-9-1']:
		case channels['apply-raider-9-1-inhouse']:
			if (!message.author.bot && content.startsWith('https://raider.io/characters/')) {
				content = `!applyRaid ${content}`;
			}
			break;
		case channels['apply-advertiser']:
		case channels['apply-advertiser-inhouse']:
			content = `!applyAdvertiser ${content}`;
			break;
		case channels['apply-pvp']:
		case channels['apply-pvp-inhouse']:
			if (!message.author.bot && content.startsWith('https://check-pvp.fr/')) {
				content = `!applyPvp ${content}`;
			}
			break;
		case channels['bot-status']:
			if (!message.author.bot) {
				content = `!botupdate ${content}`
			}
			break;
		default:
			break;
	}

	return content;
}


client.on('interactionCreate', async interaction => {
	const message = await interaction.channel.messages.fetch(interaction.toJSON().message)

	if (interaction.isSelectMenu()) {
		if (interaction.customId === 'applications') {
			switch (interaction.values[0]) {
				case 'mplus':
					await selectMplus(client, interaction, message)
					break;
				case 'raid':
					await selectRaid(client, interaction, message)
					break;
				case 'advertiser':
					break;
				case 'pvp':
					break;
				case 'misc':
					break;
				default:
					break;
			}
		}
	} else if (interaction.isButton()) {
		if (interaction.channelId === '880205790877720627' || interaction.channel.name.some(channelName => ['review', 'apps'].includes(channelName))) {
			await applyMplusHandle(client, interaction, message)
		}
	}
});

client.on('messageReactionAdd', async (messageReaction, user) => {
	if (!user.bot) {
		const message = messageReaction.message;
		const channel = message.channel;
		let emoji = messageReaction.emoji.id;
		if (emoji === undefined || emoji === null) {
			emoji = messageReaction.emoji.name;
			if (emoji === undefined || emoji === null) {
				emoji = messageReaction.emoji;
			}
		}

		switch (channel.parentID) {
			case '698608357019222106': // Admin (testing)
			case '697453867750654062': // Horde
			case '875381998615658556': // On-going boosts
				if (emoji === emotes.teamTake) {
					await teamClaimReactionAdd(client, message, channel, emoji, user);
				} else {
					await mPlusSignUps(client, message, channel, emoji, user);
				}
				break;
			default:
				break;
		}

		switch (message.channel.id) {
			case channels['apply-mplus-inhouse']:
			case channels['apply-mplus']:
				await applyMplus(client, message, channel, emoji, user);
				break;
			case channels['apply-raid-inhouse']:
			case channels['apply-raid']:
			case channels['apply-raider-9-1']:
			case channels['apply-raider-9-1-inhouse']:
				await applyRaid(client, message, channel, emoji, user);
				break;
			case channels['apply-pvp-inhouse']:
			case channels['apply-pvp']:
				await applyPvp(client, message, channel, emoji, user);
				break;
			case channels['h-nathria-hc-1']:
			case channels['h-nathria-hc-2']:
			case channels['h-curve-spam']:
			case channels['h-nathria-normal']:
			case channels['a-nathria-hc-1']:
			case channels['a-nathria-hc-2']:
				await sendRaidDm(client, message, channel, emoji, user);
				break;
			case channels.Collections:
				await collectorReaction(client, message, channel, emoji, user);
				break;
			case channels['check-balance']:
				await transferBalance(client, message, channel, emoji, user)
				break;
			case channels['balance']:
				await checkBal(client, message, channel, emoji, user)
				break;
			case channels['review-adv-application']:
				await handleAdvApps(client, message, channel, emoji, user)
				break;
			case channels['post-raid-attendance-h']:
			case channels['post-raid-attendance-a']:
				await raidAttendance(client, message, channel, emoji, user)
				break;
			default:
				break;
		}

		const dayOfTheWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const channelNameSplit = message.channel.name.split('-');
		if (dayOfTheWeek.includes(channelNameSplit[0])) {
			await formRaidReaction(client, message, channel, emoji, user);
		}
	}

});

client.on('messageReactionRemove', async (messageReaction, user) => {
	if (!user.bot) {
		const message = messageReaction.message;
		const channel = message.channel;
		let emoji = messageReaction.emoji.id;
		if (emoji === null) {
			emoji = messageReaction.emoji.name;
		}

		switch (channel.parentID) {
			case '698608357019222106': // Admin (testing)
			case '697453867750654062': // Horde
			case '875381998615658556': // On-going boosts
				if (emoji === emotes.teamTake) {
					await teamClaimReactionRemove(client, message, channel, emoji, user);
				} else {
					await mPlusLogOut(client, message, channel, emoji, user);
				}
				break;
			default:
				break;
		}

		switch (message.channel.id) {
			case '64535434324231312':
				await collectorReactionRemove(client, message, channel, emoji, user);
				break;
			case channels['apply-raid-inhouse']:
			case channels['apply-raid']:
			case channels['apply-raider-9-1']:
			case channels['apply-raider-9-1-inhouse']:
				await applyRaidRemove(client, message, channel, emoji, user)
				break;
			default:
				break;
		}
	}

});

client.on('raw', async (packet) => {
	// We don't want this to run on unrelated packets
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
	// Grab the channel to check the message from
	const channel = client.channels.cache.get(packet.d.channel_id);
	// There's no need to emit if the message is cached, because the event will fire anyway for that
	if (channel.messages.cache.has(packet.d.message_id)) return;
	// Since we have confirmed the message is not cached, let's fetch it
	channel.messages.fetch(packet.d.message_id).then(message => {
		// Emojis can have identifiers of name:id format, so we have to account for that case as well
		const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
		// This gives us the reaction we need to emit the event properly, in top of the message object
		// const reaction = message.reactions.get(emoji);
		// Adds the currently reacting user to the reaction's users collection.
		// if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
		// Check which type of event it is before emitting
		const messageReaction = {
			'message': message,
			'emoji': emoji,
		};

		client.users.fetch(packet.d.user_id).then(user => {
			if (packet.t === 'MESSAGE_REACTION_ADD') {
				client.emit('messageReactionAdd', messageReaction, user);
			}
			if (packet.t === 'MESSAGE_REACTION_REMOVE') {
				client.emit('messageReactionRemove', messageReaction, user);
			}
		});
	});
});
