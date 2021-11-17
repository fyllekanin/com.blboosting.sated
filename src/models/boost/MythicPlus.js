const { MessageEmbed } = require('discord.js');
const emojis = require('../../JSON/emojis.json');
const roles = require('../../JSON/server-info/roles.json');
const utils = require('../../common/utils/utils');
const thresholds = require('../../JSON/thresholds.json');
const numeral = require('numeral');

class MythicPlusBoost {

    constructor() {
        this.boostId = '';

        // Users
        this.tank = '';
        this.healer = '';
        this.dps1 = '';
        this.dps2 = '';
        this.keystoneUser = '';
        this.advertiser = '';
        this.collector = '';
        this.onTheWay = ''

        this.tankArray = [];
        this.healerArray = [];
        this.dpsArray = [];
        this.keyholderArray = [];

        // message
        this.boostMessage = null;

        // embed
        this.embed = null;

        // gold variables
        this.payments = [];
        this.totalPot = null;
        this.boosterPot = null;
        this.discount = null;

        // message variables
        this.dungeon = null;
        this.armorStack = null;
        this.armorStackName = null;
        this.keyLvl = [];
        this.keys = [];
        this.amountKeys = null;
        this.note = null;
        this.boosteeName = null;
        this.charToWhisper = null;
        this.source = null;
        this.goldOn = null;
        this.channel = null;
        this.currentStack = null;
        this.timed = null;
        this.selfplay = null;

        // color
        this.currentColor = '5a00eb';

        this.creatingColor = '5a00eb';
        this.inProgressColor = 'ffe100';
        this.completeColor = '00c940';

        // Money Bag Message
        this.moneyBagMessage = null;

        this.voiceCode = null;
        this.voiceChannel = null;

        this.collected = false;
        this.cancel = false;
        this.completed = false;

        this.isTeamClaimed = false;
        this.teamClaim = {};

        this.teamClaimQueue = {};
        this.teamName = null;
        this.teamNameOriginal = null;
        this.teamNameOriginalRole = null;
        this.isTrial = false;

        this.date = '';

        this.sheetRow = '';
        this.inTime = '';

        this.timeout = null;
    }

    cancelBoost() {
        const generatedEmbed = new MessageEmbed();
        generatedEmbed.setDescription('Boost Canceled');

        return generatedEmbed;
    }

    splitPot() {
        // Booster Fee
        this.boosterPot = ((this.totalPot * 0.70) / 4);

    }

    createEmbed() {
        let boosterString = `<:TANK:${emojis.tank}> ${this.tank}`;

        boosterString += `\n<:HEALER:${emojis.healer}> ${this.healer}`;

        boosterString += `\n<:dps:${emojis.dps}> ${this.dps1}`;

        boosterString += `\n<:dps:${emojis.dps}> ${this.dps2}`;

        if (!this.keys.map(key => key.dungeon.toUpperCase()).includes('ANY')) {
            boosterString += `\n\n<:keystone:${emojis.keystone}> ${this.keystoneUser}`;
        }

        const embed = (this.isTrial ? this.getTrialEmbed(boosterString) : this.getNormalEmbed(boosterString));

        const embedMsg = new MessageEmbed(embed);

        if (this.collected && this.voiceCode) {
            embedMsg.addField('Voice Channel', `[Join Voice](${this.voiceCode})`, true);
        }

        if (this.note) {
            embedMsg.addField('Notes', `${this.note}`);
        }
        if (this.onTheWay) {
            let field = embedMsg.fields.find(field => field.name.toLowerCase() === 'collector')
            if (field) {
                field.value = `✋ ${this.onTheWay}`
            }
        }
        if (this.collector) {
            let field = embedMsg.fields.find(field => field.name.toLowerCase() === 'collector')
            if (field) {
                field.value = `${this.collector}`
            }
        }

        return embedMsg;

    }

    createTeamEmbed(message) {
        // eslint-disable-next-line no-mixed-spaces-and-tabs
        let boosterString = `${this.teamNameOriginalRole}`;

        // eslint-disable-next-line no-mixed-spaces-and-tabs
        const teamClaimed = this.teamClaim[this.teamName];
        boosterString += `\n${utils.getUserMember(message.guild, teamClaimed[0])}`;
        boosterString += `\n${utils.getUserMember(message.guild, teamClaimed[1])}`;
        boosterString += `\n${utils.getUserMember(message.guild, teamClaimed[2])}`;
        boosterString += `\n${utils.getUserMember(message.guild, teamClaimed[3])}`;

        const embed = {
            'title': 'Mythic Dungeon Boost',
            'color': `${this.currentColor}`,
            'footer': {
                'text': `${emojis.repeat}: ${this.amountKeys.toString()}
${emojis.id}: ${this.boostId}
${emojis.timestamp}: ${this.date}
`,
            },
            'fields': [
                {
                    'name': 'Boosters',
                    'value': `${boosterString}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': true,
                },
                {
                    'name': 'Armor Stack',
                    'value': `${this.armorStack.join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': false,
                },
                {
                    'name': 'Keystone Level',
                    'value': `${this.keys.map(key => key.level).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Specific Key',
                    'value': `${this.keys.map(key => key.dungeon).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Timed',
                    'value': `${this.keys.map(key => key.timed ? 'Yes' : 'No').join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Booster pot',
                    'value': `<:gold:701099811029385226>${numeral(this.boosterPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Total pot',
                    'value': `<:gold:701099811029385226>${numeral(this.totalPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Source',
                    'value': `${this.source}`,
                    'inline': true,
                },
                {
                    'name': 'Server Payment(s)',
                    'value': `${this.payments.length > 4 ? this.payments.map(payment => payment.realm).slice(0, 4).join(',\n') + `,\n...` : this.payments.map(payment => payment.realm).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Advertiser',
                    'value': `${this.advertiser}`,
                    'inline': true,
                },
            ],
        };
        const embedMsg = new MessageEmbed(embed);

        if (this.collected && this.voiceCode) {
            embedMsg.addField('Voice Channel', `[Join Voice](${this.voiceCode})`, true);
        }

        if (this.note) {
            embedMsg.addField('Notes', `${this.note}`);
        }

        return embedMsg;

    }

    validateUniqueSign(userToValidate) {
        return [this.tank, this.healer, this.dps1, this.dps2].every(booster => userToValidate.id !== booster.id);
    }
    throttleEdit(message, embedType) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(async () => {
            embedType === 'normal'
                ? await message.edit({ embeds: [this.createEmbed()] })
                : await message.edit({ embeds: [this.createTeamEmbed(message)] })
        }, 2000);
    }
    getNormalEmbed(boosterString) {
        const embed = {
            'title': 'Mythic Dungeon Boost',
            'color': `${this.currentColor}`,
            'footer': {
                'text': `${emojis.repeat}: ${this.amountKeys.toString()}
${emojis.id}: ${this.boostId}
${emojis.timestamp}: ${this.date}
`,
            },
            'fields': [
                {
                    'name': 'Boosters',
                    'value': `${boosterString}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': true,
                },
                {
                    'name': 'Armor Stack',
                    'value': `${this.armorStack.join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': false,
                },
                {
                    'name': 'Keystone Level',
                    'value': `${this.keys.map(key => key.level).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Specific Key',
                    'value': `${this.keys.map(key => key.dungeon).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Timed',
                    'value': `${this.keys.map(key => key.timed ? 'Yes' : 'No').join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Booster pot',
                    'value': `<:gold:701099811029385226>${numeral(this.boosterPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Total pot',
                    'value': `<:gold:701099811029385226>${numeral(this.totalPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Source',
                    'value': `${this.source}`,
                    'inline': true,
                },
                {
                    'name': 'Server Payment(s)',
                    'value': `${this.payments.length > 4 ? this.payments.map(payment => payment.realm).slice(0, 4).join(',\n') + `,\n...` : this.payments.map(payment => payment.realm).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Advertiser',
                    'value': `${this.advertiser}`,
                    'inline': true,
                },
            ],
        };

        return embed;
    }
    getTrialEmbed(boosterString) {
        let collect;
        if (this.collector === '') {
            collect = "Waiting for collector";
        } else {
            collect = this.collector;
        }
        const embed = {
            'title': 'Mythic Dungeon Boost',
            'color': `${this.currentColor}`,
            'footer': {
                'text': `${emojis.repeat}: ${this.amountKeys.toString()}
${emojis.id}: ${this.boostId}
${emojis.timestamp}: ${this.date}
`,
            },
            'fields': [
                {
                    'name': 'Boosters',
                    'value': `${boosterString}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': true,
                },
                {
                    'name': 'Armor Stack',
                    'value': `${this.armorStack.join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': false,
                },
                {
                    'name': 'Keystone Level',
                    'value': `${this.keys.map(key => key.level).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Specific Key',
                    'value': `${this.keys.map(key => key.dungeon).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Timed',
                    'value': `${this.keys.map(key => key.timed ? 'Yes' : 'No').join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Booster pot',
                    'value': `<:gold:701099811029385226>${numeral(this.boosterPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Total pot',
                    'value': `<:gold:701099811029385226>${numeral(this.totalPot.toString()).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Source',
                    'value': `${this.source}`,
                    'inline': true,
                },
                {
                    'name': 'Server Payment(s)',
                    'value': `${this.payments.length > 4 ? this.payments.map(payment => payment.realm).slice(0, 4).join(',\n') + `,\n...` : this.payments.map(payment => payment.realm).join(',\n')}`,
                    'inline': true,
                },
                {
                    'name': 'Collector',
                    'value': `${collect}`,
                    'inline': true,
                },
            ],
        };
        return embed;
    }
    assignSelfplay(data) {
        switch (data.advertiser.role) {
            case 'Tank':
                this.tankArray.push(this.advertiser);
                if (this.tank) return;
                this.tank = this.advertiser;
                break;
            case 'Healer':
                this.healerArray.push(this.advertiser);
                if (this.healer) return;
                this.healer = this.advertiser;
                break;
            case 'DPS':
                this.dpsArray.push(this.advertiser);
                if (!this.dps1) {
                    this.dps1 = this.advertiser
                } else if (!this.dps2) {
                    this.dps2 = this.advertiser
                }
                break;
            default:
                throw new Error('Role not defined');
        }
    }
    assignBooster(key, guild) {
        const booster = guild.members.cache.get(key.booster.boosterId);
        let allowedRole;
        const lowKeyPermission = this.currentStack <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`];
        const midKeyPermission = this.currentStack <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`] && this.currentStack > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`];
        const highKeyPermission = this.currentStack <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`] && this.currentStack > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`];
        const eliteKeyPermission = this.currentStack > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`];

        switch (true) {
            case (/MYTHIC/i).test(this.currentStack):
            case (/HARD_MODE/i).test(this.currentStack):
                allowedRole = roles['High Key Booster'];
                break;
            case /[0-9]+/.test(this.currentStack):
                switch (true) {
                    case (lowKeyPermission):
                        allowedRole = roles['Low Key Booster'];
                        break;
                    case (midKeyPermission):
                        allowedRole = roles['Mid Key Booster'];
                        break;
                    case (highKeyPermission):
                        allowedRole = roles['High Key Booster'];
                        break;
                    case (eliteKeyPermission):
                        allowedRole = roles['Elite Key Booster'];
                        break;
                }
                break;
            default:
                throw new Error('Invalid currentStack variable');
        }

        if (!booster.roles.cache.has(allowedRole)) throw new Error(`Booster ${booster} is not permitted to boost ${this.currentStack}`);

        switch (key.booster.role) {
            case 'Tank':
                this.tankArray.push(booster);

                if ([this.tank, this.healer, this.dps1, this.dps2].some(user => user === booster)) break;

                this.tank = booster;
                break;
            case 'Healer':
                this.healerArray.push(booster);

                if ([this.tank, this.healer, this.dps1, this.dps2].some(user => user === booster)) break;

                this.healer = booster;
                break;
            case 'DPS':
                this.dpsArray.push(booster);

                if ([this.tank, this.healer, this.dps1, this.dps2].some(user => user === booster)) break;

                if (!this.dps1) {
                    this.dps1 = booster;
                    break;
                } else if (!this.dps2) {
                    this.dps2 = booster;
                    break;
                } else break;
            default:
                throw new Error('Role not defined');
        }
        if (key.dungeon.toLowerCase() !== 'any' && !this.keystoneUser) {
            this.keystoneUser = guild.members.cache.get(key.booster.boosterId);
            this.keyholderArray.push(guild.members.cache.get(key.booster.boosterId));
        }
    }
    /**
     * Get the stack limit from the key level in consideration
     * @param {Number | String} stackLimit Highest keylevel to compare against requirements
     * @returns {Number} The found role's maximum keylevel allowed to boost
     */
    getCurrentStack(stackLimit) {
        // Fix so initial pinged role isn't checking currentStack
        // Setting current stack receives the threshold value
        // Pinged role is set dependant on the currentStack which is threshold value
        switch (true) {
            case (/MYTHIC/i).test(stackLimit):
            case (/HARD_MODE/i).test(stackLimit):
                return thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`];
            case /[0-9]+/.test(stackLimit):
                switch (true) {
                    case (stackLimit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`]):
                        return thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`];
                    case (stackLimit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`] && stackLimit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`]):
                        return thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`];
                    case (stackLimit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`] && stackLimit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`]):
                        return thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`];
                    case (stackLimit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`]):
                        return thresholds[`${this.timed ? 'Timed' : 'Untimed'}_EliteKeyBooster`];
                }
                break;
        }
    }
    /**
     * @returns {String} Enum within ['Elite' | 'High' | 'Mid' | 'Low'] to recognize what boosters are allowed
     */
    getAllowedRoleEnum(limit) {
        switch (true) {
            case (/MYTHIC/i).test(limit):
            case (/HARD_MODE/i).test(limit):
                return 'High';
            case /[0-9]+/.test(limit):
                switch (true) {
                    case (limit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`]):
                        return 'Low';
                    case (limit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`] && limit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_LowKeyBooster`]):
                        return 'Mid';
                    case (limit <= thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`] && limit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_MidKeyBooster`]):
                        return 'High';
                    case (limit > thresholds[`${this.timed ? 'Timed' : 'Untimed'}_HighKeyBooster`]):
                        return 'Elite';
                }
                break;
        }
    }
    getOneRoleLower(role) {
        switch(role) {
            case 'Elite':
                return 'High';
            case 'High':
                return 'Mid';
            case 'Mid':
                return 'Low';
            default:
                return 'Low';
        }
    }
    async getRolesToPing() {
        const armorStackTags = [];
        const roleRank = this.getAllowedRoleEnum(this.getHighestKeylevel());

        if (!this.armorStackName.some(role => ['PLATE', 'LEATHER', 'MONK', 'DRUID', 'DEMON HUNTER', 'PALADIN', 'DEATH KNIGHT', 'WARRIOR', 'ANY'].includes(role.toUpperCase()))) {
            armorStackTags.push(`<@&${roles[`${roleRank} Keys Tank`]}>`);
        }
        if (!this.armorStackName.some(role => ['PLATE', 'LEATHER', 'CLOTH', 'MAIL', 'DRUID', 'MONK', 'PALADIN', 'PRIEST', 'SHAMAN', 'ANY'].includes(role.toUpperCase()))) {
            armorStackTags.push(`<@&${roles[`${roleRank} Keys Healer`]}>`);
        }

        for (let stack of this.armorStackName) {
            switch (stack.toUpperCase()) {
                case 'ANY':
                    armorStackTags.push(`<@&${roles[`${roleRank} Key Booster`]}>`);
                    break;
                case 'CLOTH':
                    armorStackTags.push(`<@&${roles.Cloth}>`);
                    break;
                case 'LEATHER':
                    armorStackTags.push(`<@&${roles.Leather}>`);
                    break;
                case 'MAIL':
                    armorStackTags.push(`<@&${roles.Mail}>`);
                    break;
                case 'PLATE':
                    armorStackTags.push(`<@&${roles.Plate}>`);
                    break;
                case 'MAGE':
                    armorStackTags.push(`<@&${roles['Mage']}>`);
                    break;
                case 'PRIEST':
                    armorStackTags.push(`<@&${roles['Priest']}>`);
                    break;
                case 'WARLOCK':
                    armorStackTags.push(`<@&${roles['Warlock']}>`);
                    break;
                case 'DEMON HUNTER':
                    armorStackTags.push(`<@&${roles['Demon Hunter']}>`);
                    break;
                case 'DRUID':
                    armorStackTags.push(`<@&${roles['Druid']}>`);
                    break;
                case 'MONK':
                    armorStackTags.push(`<@&${roles['Monk']}>`);
                    break;
                case 'ROGUE':
                    armorStackTags.push(`<@&${roles['Rogue']}>`);
                    break;
                case 'HUNTER':
                    armorStackTags.push(`<@&${roles['Hunter']}>`);
                    break;
                case 'SHAMAN':
                    armorStackTags.push(`<@&${roles['Shaman']}>`);
                    break;
                case 'DEATH KNIGHT':
                    armorStackTags.push(`<@&${roles['Death Knight']}>`);
                    break;
                case 'PALADIN':
                    armorStackTags.push(`<@&${roles['Paladin']}>`);
                    break;
                case 'WARRIOR':
                    armorStackTags.push(`<@&${roles['Warrior']}>`);
                    break;
            }
        }

        return [...new Set(armorStackTags)].join(' ');
    }
    /**
     * 
     * @returns The highest valid timed keylevel
     */
    getHighestKeylevel() {
        const findKey = (prev, curr) => prev && prev.level > curr.level ? prev : curr;
        return this.keys.some(key => key.timed)
            ? this.keys.filter(key => key.timed).reduce(findKey, null).level
            : this.keys.reduce(findKey, null).level;
    }
    getDate() {
        const now = new Date(Date.now());

        const date = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const hours = now.getHours() + 1;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        return `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    isTankEligable(memberRoles, hasTankRole, armorStacks, classStacks) {
        const tankableClasses = ['Monk', 'Druid', 'Demon Hunter', 'Paladin', 'Warrior', 'Death Knight'];
        const tankableArmors = ['Leather', 'Plate'];

        const pickedTankableClassStacks = classStacks.filter(stack => tankableClasses.includes(stack));
        const pickedTankableArmorStacks = armorStacks.filter(stack => tankableArmors.includes(stack));

        const isAnyTankStack = [...armorStacks, ...classStacks].filter(stack => [...tankableArmors, ...tankableClasses].includes(stack)).length === 0;

        const isAllowedToTankSpecific = memberRoles.some(role => [...pickedTankableClassStacks, ...pickedTankableArmorStacks].includes(role)) && hasTankRole;
        const isAllowedToTankAny = isAnyTankStack && hasTankRole;

        return isAllowedToTankSpecific || isAllowedToTankAny;
    }
    isHealerEligable(memberRoles, hasHealerRole, armorStacks, classStacks) {
        const healableClasses = ['Druid', 'Monk', 'Paladin', 'Priest', 'Shaman'];
        const healableArmors = ['Cloth', 'Leather', 'Mail', 'Plate'];

        const pickedHealableClassStacks = classStacks.filter(stack => healableClasses.includes(stack));
        const pickedHealableArmorStacks = armorStacks.filter(stack => healableArmors.includes(stack));

        const isAnyHealerStack = [...armorStacks, ...classStacks].filter(stack => [...healableArmors, ...healableClasses].includes(stack)).length === 0;

        const isAllowedToHealSpecific = memberRoles.some(role => [...pickedHealableClassStacks, ...pickedHealableArmorStacks].includes(role)) && hasHealerRole;
        const isAllowedToHealAny = isAnyHealerStack && hasHealerRole;

        return isAllowedToHealSpecific || isAllowedToHealAny;
    }
    isDPSEligable(memberRoles, hasDPSRole, armorStacks, classStacks) {
        const dpsAbleClasses = ['Death Knight', 'Druid', 'Demon Hunter', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
        const dpsAbleArmors = ['Cloth', 'Leather', 'Mail', 'Plate'];

        const pickedDPSableClassStacks = classStacks.filter(stack => dpsAbleClasses.includes(stack));
        const pickedDPSableArmorStacks = armorStacks.filter(stack => dpsAbleArmors.includes(stack));

        const isAnyDPSStack = [...armorStacks, ...classStacks].filter(stack => [...dpsAbleArmors, ...dpsAbleClasses].includes(stack)).length === 0;

        const isAllowedToDPSSpecific = memberRoles.some(role => [...pickedDPSableClassStacks, ...pickedDPSableArmorStacks].includes(role)) && hasDPSRole;
        const isAllowedToDPSAny = isAnyDPSStack && hasDPSRole;

        return isAllowedToDPSSpecific || isAllowedToDPSAny;
    }
}

module.exports = MythicPlusBoost;