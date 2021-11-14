const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const teamClaimSemaphore = require('semaphore')(1);
const teamClaimCooldownFilePath = path.resolve(__dirname, '../../JSON/teams-cooldown/teamclaim.json');

const roles = require('../../JSON/server-info/roles.json');
const channels = require('../../JSON/server-info/channels.json');
const thresholds = require('../../JSON/thresholds.json');

const MAX_RUN_PER_DAY = 4;
const RESET_HOUR = 6;

const self = module.exports = {
    isDirector: async (member) => {
        if (member.roles.cache.some(r => ['Director'].includes(r.name))) {
            return true;
        }
        return false;
    },
    isAdminOrAbove: async (member) => {
        if (member.roles.cache.some(r => ['Director', 'Management', 'Developer'].includes(r.name))) {
            return true;
        }
        return false;
    },
    isManagerOrAbove: async (member) => {
        if (await self.isAdminOrAbove(member) || member.roles.cache.has(roles.Staff)) {
            return true;
        }
        return false;
    },
    isDeveloper: async (member) => {
        if (member.roles.cache.has(roles.Developer)) {
            return true;
        }
        return false;
    },
    isGroupleaderOrAbove: async (member) => {
        if (await self.isManagerOrAbove(member) || member.roles.cache.has(roles['Group Leader'])) {
            return true;
        }
        return false;
    },
    isCollectorOrAbove: async (member) => {
        if (await self.isManagerOrAbove(member) || member.roles.cache.has(roles.Collector)) {
            return true;
        }
        return false;
    },
    isAdvertiserOrAbove: async (member) => {
        if (await self.isCollectorOrAbove(member) || member.roles.cache.has(roles.Advertiser)) {
            return true;
        }
        return false;
    },
    isTrialAdvertiser: async (member) => {
        if (member.roles.cache.has(roles['Trial Advertiser'])) {
            return true;
        }
        return false;
    },
    isMember: async (member) => {
        if (member.roles.cache.some(r => ['Horde', 'Alliance'].includes(r.name))) {
            return true;
        }
        return false;
    },
    parser: (filePath, cb) => {
        fs.readFile(filePath, 'utf8', (err, fileData) => {
            if (err) {
                return cb && cb(err)
            }
            try {
                const object = JSON.parse(fileData)
                return cb && cb(null, object)
            } catch (err) {
                return cb && cb(err)
            }
        })
    },
    throttleEdit: (boostMsg, message, embedType) => {
        clearTimeout(boostMsg.timeout);
        boostMsg.timeout = setTimeout(async () => {
            embedType === 'normal'
                ? await message.edit({ embeds: [boostMsg.createEmbed()] })
                : await message.edit({ embeds: [boostMsg.createTeamEmbed(message)] })
        }, 2000);
    },
    linkBuilder: (boostMsg) => {
        return `https://discord.com/channels/693420859930443786/${boostMsg.channel.id}/${boostMsg.boostId}`
    },
    wrongRole: async (user, message, reactionName) => {
        const userId = user.id;
        const userReactions = [];
        message.reactions.cache.filter(reaction => {
            if (reaction.emoji.name.toLowerCase() === reactionName
                || reaction.emoji.id === reactionName) {

                if (reaction.users.cache.has(userId)) {
                    userReactions.push(reaction);
                }
            }
        });
        try {
            for (const reaction of userReactions.values()) {
                await reaction.users.remove(userId);
            }
        } catch (error) {
            console.error('Failed to remove reactions.');
        }
    },
    getNickname: async (user, guild) => {
        let userNickName = guild.members.cache.get(user.id).nickname;
        if (!userNickName) {
            userNickName = user.username;
        }

        const tags = [
            'Dev | ',
            'Adv | ',
            'Raid | ',
            'Apps | ',
            'Bank | ',
            'Mounts | ',
            'Spreadsheet | ',
            'M+ | ',
            'M+ Support | ',
            'Recruitment | ',
            'PVP | ',
            'Marketing | ',
            'Raid Support | ',
            'Adv Support | ',
            'Support | '
        ]

        for (let tag of tags) {
            if (userNickName?.includes(tag)) {
                userNickName = userNickName.replace(tag, '');
                break;
            }
        }

        switch (userNickName) {
            case 'Hulken':
                userNickName = 'Fleqqydruid-TarrenMill [H]';
                break;
            case 'Philip':
            case 'Rutberg':
            case 'General Knas':
            case 'John Xina':
                userNickName = 'Kelthuras-TwistingNether [H]';
                break;
            case 'Midjet':
                userNickName = 'Midjet-Mazrigos [H]';
                break;
            case 'Maghawk':
            case 'Foxxy':
                userNickName = 'Foxxyboi-Kazzak [H]';
                break;
            case 'Angrymidget':
                // userNickName = 'Angrymidget-Drak\'thul [H]';
                userNickName = 'Uanubis-Elune [H]'
                break;
            case 'Sheep':
                userNickName = 'Staarsheep-Stormscale [H]';
                break;
            case 'Archaic':
                userNickName = 'Archaic-Sunstrider [H]';
                break;
            case 'Ackreon':
                userNickName = 'Ackreon-Darkspear [A]';
                break;
            case 'Shiora':
                userNickName = 'Shiora-Drak\'thul [H]';
                break;
            case 'Moonmeta':
            case 'Moon':
                userNickName = 'Moonmeta-Kazzak [H]';
                break;
            case 'Garage':
                userNickName = 'Garagemonk-TwistingNether [H]';
                break;
            case 'Daddyfister':
            case 'Sisterfister':
                userNickName = 'Daddyfister-Kazzak [H]'
                // userNickName = 'Daddyfister-TarrenMill [H]'
                break;
            case 'Thedrunken':
                userNickName = 'Thedrunken-Kazzak [H]'
                break;
            case 'Zaazu':
                userNickName = 'Zaazu-Twilight\'sHammer [H]'
                break;
        }

        return userNickName;
    },
    updateMplusChannelPerms: async (message, boost) => {
        if (message.channel.id === channels['testing-1']) return;

        const allowedEnum = boost.getAllowedRoleEnum(boost.currentStack);

        message.channel.updateOverwrite(roles[`${allowedEnum} Key Booster`], {
            VIEW_CHANNEL: true,
            READ_MESSAGE_HISTORY: true,
            SEND_MESSAGES: false,
            EMBED_LINKS: false,
            ATTACH_FILES: false,
            MANAGE_MESSAGES: false,
            ADD_REACTIONS: false
        });

        boost.currentStack = thresholds[`${boost.timed ? 'Timed' : 'Untimed'}_${allowedEnum}KeyBooster`];

        return message.channel.send({ content: `Channel unlocked for ${allowedEnum} Key Booster` });
    },
    armorStackRole: async (armorStack, boost) => {
        let armorStackRoleAux = [];
        const stack = boost.currentStack
        const limit = boost.getAllowedRoleEnum(stack);
        if (!armorStack.some(role => ['PLATE', 'LEATHER', 'MONK', 'DRUID', 'DEMON HUNTER', 'PALADIN', 'DEATH KNIGHT', 'WARRIOR', 'ANY'].includes(role.toUpperCase()))) {
            armorStackRoleAux.push(`<@&${roles[`${limit} Keys Tank`]}>`);
        }
        if (!armorStack.some(role => ['PLATE', 'LEATHER', 'CLOTH', 'MAIL', 'DRUID', 'MONK', 'PALADIN', 'PRIEST', 'SHAMAN', 'ANY'].includes(role.toUpperCase()))) {
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
        return `https://discord.com/channels/693420859930443786/${boostMsg.channel.id}/${boostMsg.boostId}`
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
            fs.writeFileSync(teamClaimCooldownFilePath, JSON.stringify(teamClaimCooldown));

            boosterIds.forEach((boosterId) => {
                // const user = findGuildMember(message, boosterId);
                const user = message.guild.member(boosterId);
                if (!user) return;

                const embedMessage = new MessageEmbed();
                // const embedMessage = getEmbedTemplate('Team Claim');
                embedMessage.setDescription(`Hello ${user},
 
Your team is going to boost through the \`TeamClaim\` option. 

You can use this feature **${MAX_RUN_PER_DAY} times per day max** and the **cool down resets at ${RESET_HOUR}am** GMT 0.

If you are removed from the boost, your credit will be added back automatically.`)
                    .addField('Boost done', value, true)
                    .addField('Remaining', MAX_RUN_PER_DAY - value, true);
                user.send({ embeds: [embedMessage] })
                    .catch(console.error);
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
            if (!teamClaimCooldown.hasOwnProperty(teamName)) teamClaimCooldown[teamName] = 0;
            teamClaimCooldown[teamName] -= 1;

            fs.writeFileSync(teamClaimCooldownFilePath, JSON.stringify(teamClaimCooldown));

            teamClaimSemaphore.leave();
        });
    },
    getChannelById(guild, channelId) {
        return guild.channels.cache.get(channelId);
    },
    async createMplusChannel(message, boost) {
        const channel = message.channel;
        const guild = message.guild;

        if (channel.id === channels['testing-1']) {
            boost.channel = channel;
            return;
        }

        const boosterType = boost.getAllowedRoleEnum(boost.getHighestKeylevel());
        const boosterRole = roles[`${boosterType} Key Booster`];

        let keyType;
        if (boost.keys.length > 1) {
            boost.keys.map(key => key.dungeon.toLowerCase()).every(key => key !== 'any')
                ? keyType = 'specific'
                : boost.keys.map(key => key.dungeon.toLowerCase()).every(key => key === 'any')
                    ? keyType = 'any'
                    : keyType = 'mixed';
        }

        let channelName;
        boost.keys.length > 1
            ? channelName = `${boost.keys.length.toString()}x-${keyType}-${boost.timed ? 'timed' : 'untimed'}`
            : channelName = `1x-${boost.keys[0].dungeon}-${boost.keys[0].level}-${boost.timed ? 'timed' : 'untimed'}`;

        const boostChannel = await guild.channels.create(channelName, {
            parent: channel.parentID,
            type: 'text',
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    // Director
                    id: '846100792343527474',
                    allow: ['VIEW_CHANNEL'],
                },
                {
                    // Admin
                    id: '846100756633616414',
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'MANAGE_GUILD', 'ADD_REACTIONS'],
                },
                {
                    // Staff
                    id: '845751878707970058',
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'MANAGE_GUILD', 'ADD_REACTIONS'],
                },
                {
                    // Advertiser
                    id: boost.advertiser.user.id,
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

