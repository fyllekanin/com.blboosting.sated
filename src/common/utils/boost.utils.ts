import { Management } from './../enums/management.enum';
import {
  Collection,
  Emoji,
  Guild,
  GuildMember,
  Message,
  MessageEmbed,
  MessageReaction,
  Role,
  Snowflake,
  TextBasedChannels,
  TextChannel,
} from 'discord.js';
import * as fs from 'fs';
import path from 'path';

const teamClaimSemaphore = require('semaphore')(1);
const teamClaimCooldownFilePath = path.resolve(
  __dirname,
  '../../JSON/teams-cooldown/teamclaim.json'
);

import { Roles } from '../constants/guildroles.constants';
import { Channels } from '../constants/channels.enum';
import { thresholds } from '../../JSON/thresholds';
import BaseBoost from '../../models/boost/BaseBoost';
import MythicPlusBoost from '../../models/boost/MythicPlusBoost';

export const self = {
  isSeniorManagerOrAbove: async (member: GuildMember) => {
    return member.roles.cache.some((role: Role) =>
      [
        <string>Roles['Director'],
        <string>Roles['Senior Management'],
        <string>Roles['Developer'],
      ].includes(role.id)
    );
  },
  isManagerOrAbove: async (member: GuildMember) => {
    return (
      (await self.isSeniorManagerOrAbove(member)) ||
      member.roles.cache.has(Roles['Management'])
    );
  },
  isDeveloper: async (member: GuildMember) => {
    return member.roles.cache.has(Roles['Developer']);
  },
  isGroupleaderOrAbove: async (member: GuildMember) => {
    return (
      (await self.isManagerOrAbove(member)) ||
      member.roles.cache.has(Roles['Group Leader'])
    );
  },
  isCollectorOrAbove: async (member: GuildMember) => {
    return (
      (await self.isManagerOrAbove(member)) ||
      member.roles.cache.has(Roles['Collector'])
    );
  },
  isAdvertiserOrAbove: async (member: GuildMember) => {
    return (
      (await self.isCollectorOrAbove(member)) ||
      member.roles.cache.has(Roles['Advertiser'])
    );
  },
  isTrialAdvertiser: async (member: GuildMember) => {
    return member.roles.cache.has(Roles['Trial Advertiser']);
  },
  isMember: async (member: GuildMember) => {
    return member.roles.cache.some((r) =>
      [<string>Roles['Horde'], <string>Roles['Alliance']].includes(r.id)
    );
  },
  parser: (filePath: string, cb: any) => {
    fs.readFile(filePath, 'utf8', (err, fileData) => {
      if (err) {
        return cb && cb(err);
      }
      try {
        const object = JSON.parse(fileData);
        return cb && cb(null, object);
      } catch (err) {
        return cb && cb(err);
      }
    });
  },
  getBoostLink: (boostMsg: BaseBoost): string => {
    return `https://discord.com/channels/693420859930443786/${boostMsg.channel.id}/${boostMsg.boostId}`;
  },
  removeUserReaction: async (
    userId: Snowflake,
    message: Message,
    emoji: Emoji | string
  ): Promise<void> => {
    const userReactions: Collection<string, MessageReaction> =
      message.reactions.cache.filter(
        (reaction) =>
          (reaction.emoji.name.toLowerCase() ===
            emoji.toString().toLowerCase() ||
            reaction.emoji.id === emoji) &&
          reaction.users.cache.has(userId)
      );
    try {
      for (const reaction of userReactions.values()) {
        await reaction.users.remove(userId);
      }
    } catch (error) {
      console.error('Failed to remove reactions.');
    }
  },
  removeEmojiReaction: async (message: Message, emoji: string) => {
    message.reactions.cache
      .get(emoji)
      .remove()
      .catch((error) => console.error('Failed to remove reactions:', error));
  },
  getNickname: async (userId: Snowflake, guild: Guild) => {
    const user = guild.members.cache.get(userId);
    const nickname = user.nickname ? user.nickname : user.user.username;

    const isManagementRegex = /[\S\s]+[|][\S\s]+/;
    const hasManagementName = isManagementRegex.test(nickname);

    if (!hasManagementName) {
      return nickname;
    }

    switch (userId) {
      case Management.Hulken:
        return 'Fleqqydruid-TarrenMill [H]';
      case Management.Philip:
        return 'Kelthuras-TwistingNether [H]';
      case Management.Midjet:
        return 'Midjet-Mazrigos [H]';
      case Management.Foxxy:
        return 'Foxxyboi-Kazzak [H]';
      case Management.Angry:
        return 'Uanubis-Elune [H]';
      case Management.Sheep:
        return 'Staarsheep-Stormscale [H]';
      case Management.Archaic:
        return 'Archaic-Sunstrider [H]';
      case Management.Shiora:
        return "Shiora-Drak'thul [H]";
      case Management.Moon:
        return 'Moonmeta-Kazzak [H]';
      case Management.Garage:
        return 'Garagemonk-TwistingNether [H]';
      case Management.Daddy:
        return 'Daddyfister-Kazzak [H]';
      case Management.Drunken:
        return 'Thedrunken-Kazzak [H]';
      case Management.Zaazu:
        return "Zaazu-Twilight'sHammer [H]";
      default:
        return nickname;
    }
  },
  updateMplusChannelPerms: async (message: Message, boost: MythicPlusBoost) => {
    if (message.channel.id === Channels['bot-spam']) return;

    const allowedEnum = boost.getAllowedRoleEnum(
      boost.lowestSignableRoleThreshold
    );
    const oneLower = boost.getOneRoleLower(allowedEnum);
    const channel = message.channel as TextChannel;
    
    await channel.permissionOverwrites.edit(Roles[`${oneLower} Key Booster`], {
      VIEW_CHANNEL: true,
      READ_MESSAGE_HISTORY: true,
      SEND_MESSAGES: false,
      EMBED_LINKS: false,
      ATTACH_FILES: false,
      MANAGE_MESSAGES: false,
      ADD_REACTIONS: false,
    });

    boost.lowestSignableRoleThreshold =
      thresholds[`${boost.timed ? 'Timed' : 'Untimed'}_${oneLower}KeyBooster`];

    return message.channel.send({
      content: `Channel unlocked for ${oneLower} Key Booster`,
    });
  },
  armorStackRole: async (armorStack, boost) => {
    let armorStackRoleAux = [];
    const stack = boost.currentStack;
    const limit = boost.getAllowedRoleEnum(stack);
    if (
      !armorStack.some((role) =>
        [
          'PLATE',
          'LEATHER',
          'MONK',
          'DRUID',
          'DEMON HUNTER',
          'PALADIN',
          'DEATH KNIGHT',
          'WARRIOR',
          'ANY',
        ].includes(role.toUpperCase())
      )
    ) {
      armorStackRoleAux.push(`<@&${roles[`${limit} Keys Tank`]}>`);
    }
    if (
      !armorStack.some((role) =>
        [
          'PLATE',
          'LEATHER',
          'CLOTH',
          'MAIL',
          'DRUID',
          'MONK',
          'PALADIN',
          'PRIEST',
          'SHAMAN',
          'ANY',
        ].includes(role.toUpperCase())
      )
    ) {
      armorStackRoleAux.push(`<@&${roles[`${limit} Keys Healer`]}>`);
    }

    for (let role of armorStack) {
      switch (role.toUpperCase()) {
        case 'ANY':
          armorStackRoleAux.push('Any');
          break;
        case 'CLOTH':
          armorStackRoleAux.push(`<@&${roles.Cloth}>`);
          break;
        case 'LEATHER':
          armorStackRoleAux.push(`<@&${roles.Leather}>`);
          break;
        case 'MAIL':
          armorStackRoleAux.push(`<@&${roles.Mail}>`);
          break;
        case 'PLATE':
          armorStackRoleAux.push(`<@&${roles.Plate}>`);
          break;
        case 'MAGE':
          armorStackRoleAux.push(`<@&${roles['Mage']}>`);
          break;
        case 'PRIEST':
          armorStackRoleAux.push(`<@&${roles['Priest']}>`);
          break;
        case 'WARLOCK':
          armorStackRoleAux.push(`<@&${roles['Warlock']}>`);
          break;
        case 'DEMON HUNTER':
          armorStackRoleAux.push(`<@&${roles['Demon Hunter']}>`);
          break;
        case 'DRUID':
          armorStackRoleAux.push(`<@&${roles['Druid']}>`);
          break;
        case 'MONK':
          armorStackRoleAux.push(`<@&${roles['Monk']}>`);
          break;
        case 'ROGUE':
          armorStackRoleAux.push(`<@&${roles['Rogue']}>`);
          break;
        case 'HUNTER':
          armorStackRoleAux.push(`<@&${roles['Hunter']}>`);
          break;
        case 'SHAMAN':
          armorStackRoleAux.push(`<@&${roles['Shaman']}>`);
          break;
        case 'DEATH KNIGHT':
          armorStackRoleAux.push(`<@&${roles['Death Knight']}>`);
          break;
        case 'PALADIN':
          armorStackRoleAux.push(`<@&${roles['Paladin']}>`);
          break;
        case 'WARRIOR':
          armorStackRoleAux.push(`<@&${roles['Warrior']}>`);
          break;
      }
    }
    return armorStackRoleAux;
  },
  linkBuiler: (boostMsg) => {
    return `https://discord.com/channels/693420859930443786/${boostMsg.channel.id}/${boostMsg.boostId}`;
  },
  getUserTeamName(message, userId) {
    const user = message.guild.members.cache.find((u) => u.id === userId);
    if (!user) return undefined;
    return user.roles.cache.find((r) => r.name.match(/Team [^[].+/i));
  },
  getUserMember(guild, userId) {
    return guild.members.cache.get(userId);
  },
  /**
   * Increase the team cooldown by one
   * @param {Message} message
   * @param {string} teamName
   * @param {Array<string>} boosterIds
   */
  addTeamToCooldown(message, teamName, boosterIds) {
    teamClaimSemaphore.take(() => {
      let teamClaimCooldown = fs.readFileSync(teamClaimCooldownFilePath);
      teamClaimCooldown = JSON.parse(teamClaimCooldown);

      // eslint-disable-next-line no-prototype-builtins
      if (!teamClaimCooldown.hasOwnProperty(teamName)) {
        teamClaimCooldown[teamName] = 0;
      }
      teamClaimCooldown[teamName] += 1;
      const value = teamClaimCooldown[teamName];
      fs.writeFileSync(
        teamClaimCooldownFilePath,
        JSON.stringify(teamClaimCooldown)
      );

      (boosterIds || []).forEach((boosterId) => {
        // const user = findGuildMember(message, boosterId);
        const user = message.guild.member(boosterId);
        if (!user) return;

        const embedMessage = new MessageEmbed();
        // const embedMessage = getEmbedTemplate('Team Claim');
        embedMessage
          .setDescription(
            `Hello ${user},
 
Your team is going to boost through the \`TeamClaim\` option. 

You can use this feature **${MAX_RUN_PER_DAY} times per day max** and the **cool down resets at ${RESET_HOUR}am** GMT 0.

If you are removed from the boost, your credit will be added back automatically.`
          )
          .addField('Boost done', value, true)
          .addField('Remaining', MAX_RUN_PER_DAY - value, true);
        user.send({ embeds: [embedMessage] }).catch(console.error);
      });

      teamClaimSemaphore.leave();
    });
  },
  /**
   * Decrease the team cooldown by 1
   * @param {Message} message
   * @param {string} teamName
   */
  removeTeamToCooldown(message, teamName) {
    teamClaimSemaphore.take(() => {
      let teamClaimCooldown = fs.readFileSync(teamClaimCooldownFilePath);
      teamClaimCooldown = JSON.parse(teamClaimCooldown);

      // eslint-disable-next-line no-prototype-builtins
      if (!teamClaimCooldown.hasOwnProperty(teamName))
        teamClaimCooldown[teamName] = 0;
      teamClaimCooldown[teamName] -= 1;

      fs.writeFileSync(
        teamClaimCooldownFilePath,
        JSON.stringify(teamClaimCooldown)
      );

      teamClaimSemaphore.leave();
    });
  },
  getChannelById(guild, channelId) {
    return guild.channels.cache.get(channelId);
  },
  async createMplusChannel(message, boost) {
    const channel = message.channel;
    const guild = message.guild;

    if (channel.id === channels['bot-spam']) {
      boost.channel = channel;
      return;
    }

    const boosterType = boost.getAllowedRoleEnum(boost.getHighestKeylevel());
    const boosterRole = roles[`${boosterType} Key Booster`];

    let keyType;
    if (boost.keys.length > 1) {
      boost.keys
        .map((key) => key.dungeon.toLowerCase())
        .every((key) => key !== 'any')
        ? (keyType = 'specific')
        : boost.keys
            .map((key) => key.dungeon.toLowerCase())
            .every((key) => key === 'any')
        ? (keyType = 'any')
        : (keyType = 'mixed');
    }

    let channelName;
    boost.keys.length > 1
      ? (channelName = `${boost.keys.length.toString()}x-${keyType}-${
          boost.timed ? 'timed' : 'untimed'
        }`)
      : (channelName = `1x-${boost.keys[0].dungeon}-${boost.keys[0].level}-${
          boost.timed ? 'timed' : 'untimed'
        }`);

    const boostChannel = await guild.channels.create(channelName, {
      parent: channels['On-Going Boosts'],
      type: 'text',
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['VIEW_CHANNEL'],
        },
        {
          // Director
          id: roles['Director'],
          allow: ['VIEW_CHANNEL'],
        },
        {
          // Admin
          id: roles['Senior Management'],
          allow: [
            'VIEW_CHANNEL',
            'SEND_MESSAGES',
            'MANAGE_MESSAGES',
            'MANAGE_GUILD',
            'ADD_REACTIONS',
          ],
        },
        {
          // Staff
          id: roles['Management'],
          allow: [
            'VIEW_CHANNEL',
            'SEND_MESSAGES',
            'MANAGE_MESSAGES',
            'MANAGE_GUILD',
            'ADD_REACTIONS',
          ],
        },
        {
          // Advertiser
          id: boost.advertiser.id,
          allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES'],
          deny: ['ADD_REACTIONS', 'MANAGE_MESSAGES'],
        },
        {
          // Booster
          id: boosterRole,
          allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
          deny: ['ADD_REACTIONS', 'MANAGE_MESSAGES', 'SEND_MESSAGES'],
        },
      ],
    });
    boost.channel = boostChannel;
  },
};
