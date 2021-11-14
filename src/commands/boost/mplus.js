const MythicPlus = require('../../models/boost/MythicPlus');
const boostHashMap = require('../../models/maps/boostMap');
const collectorHashMap = require('../../models/maps/collectorHashMap');

const Validator = require('jsonschema').Validator;
const v = new Validator();

const dungeons = require('../../JSON/dungeons.json');
const sources = require('../../JSON/sources.json');
const roles = require('../../JSON/server-info/roles.json');
const channels = require('../../JSON/server-info/channels.json');
const emojis = require('../../JSON/emojis.json');
const utils = require('../../common/common/utils/utils');
const embeds = require('../../utils/embeds')
const { MessageEmbed } = require('discord.js');
const numeral = require('numeral');
const thresholds = require('../../JSON/thresholds.json');
const Sheet = require('../../services/spreadsheet');

const creatingColor = '5a00eb';

let realmsArr = [
    "Balance",
    "AeriePeak",
    "Aggra",
    "Aggramar",
    "Alonsus",
    "Anachronos",
    "Arathor",
    "Aszune",
    "Azjol-Nerub",
    "Azuremyst",
    "Blade'sEdge",
    "Bloodhoof",
    "Bronzebeard",
    "BronzeDragonflight",
    "ChamberofAspects",
    "Darkspear",
    "Doomhammer",
    "Draenor",
    "Dragonblight",
    "Eonar",
    "Ghostlands",
    "Hellfire",
    "Hellscream",
    "Khadgar",
    "Kilrogg",
    "KulTiras",
    "Lightbringer",
    "Nagrand",
    "Nordrassil",
    "Quel'Thalas",
    "Runetotem",
    "Saurfang",
    "Shadowsong",
    "Silvermoon",
    "Stormrage",
    "Terenas",
    "Terokkar",
    "Thunderhorn",
    "Turalyon",
    "Vek'nilash",
    "Wildhammer",
    "Agamaggan",
    "Al'Akir",
    "Ahn'Qiraj",
    "Auchindoun",
    "Balnazzar",
    "Bladefist",
    "Bloodfeather",
    "Bloodscalp",
    "Boulderfist",
    "BurningBlade",
    "BurningLegion",
    "BurningSteppes",
    "Chromaggus",
    "Crushridge",
    "Daggerspine",
    "Darksorrow",
    "Deathwing",
    "Dentarg",
    "Dragonmaw",
    "Drak'thul",
    "Dunemaul",
    "Emeriss",
    "Executus",
    "Frostmane",
    "Frostwhisper",
    "Genjuros",
    "GrimBatol",
    "Haomarush",
    "Hakkar",
    "Jaedenar",
    "Karazhan",
    "Kazzak",
    "Kor'gall",
    "LaughingSkull",
    "Lightning'sBlade",
    "Magtheridon",
    "Mazrigos",
    "Neptulon",
    "Outland",
    "Ragnaros",
    "Ravencrest",
    "ShatteredHalls",
    "ShatteredHand",
    "Skullcrusher",
    "Spinebreaker",
    "Stormreaver",
    "Stormscale",
    "Sunstrider",
    "Sylvanas",
    "Talnivarr",
    "TarrenMill",
    "TheMaelstrom",
    "Trollbane",
    "Twilight'sHammer",
    "TwistingNether",
    "Vashj",
    "Xavius",
    "Zenedar",
    "ArgentDawn",
    "DarkmoonFaire",
    "EarthenRing",
    "Moonglade",
    "SteamwheedleCartel",
    "TheSha'tar",
    "DefiasBrotherhood",
    "Ravenholdt",
    "ScarshieldLegion",
    "Sporeggar",
    "TheVentureCo",
    "Chantséternels",
    "Dalaran",
    "Drek'Thar",
    "Eitrigg",
    "Elune",
    "Hyjal",
    "KhazModan",
    "Krasus",
    "MarécagedeZangar",
    "Medivh",
    "Suramar",
    "Uldaman",
    "Vol'jin",
    "Arak-arahm",
    "Arathi",
    "Archimonde",
    "Cho'gall",
    "Eldre'Thalas",
    "Garona",
    "Illidan",
    "Kael'Thas",
    "Naxxramas",
    "Ner'zhul",
    "Rashgarroth",
    "Sargeras",
    "Sinstralis",
    "Templenoir",
    "Throk'Feroth",
    "Varimathras",
    "Ysondre",
    "ConfrérieduThorium",
    "KirinTor",
    "LesClairvoyants",
    "LesSentinelles",
    "ConseildesOmbres",
    "CultedelaRiveNoire",
    "LaCroisadeécarlate",
    "Alexstrasza",
    "Alleria",
    "Aman'Thul",
    "Ambossar",
    "Antonidas",
    "Area52",
    "Arygos",
    "Baelgun",
    "Blackhand",
    "DunMorogh",
    "Durotan",
    "Gilneas",
    "Kargath",
    "Khaz'goroth",
    "Lordaeron",
    "Lothar",
    "Madmortem",
    "Malfurion",
    "Malygos",
    "Nethersturm",
    "Norgannon",
    "Nozdormu",
    "Perenolde",
    "Proudmoore",
    "Rexxar",
    "Sen'jin",
    "Shattrath",
    "Teldrassil",
    "Thrall",
    "Tirion",
    "Ysera",
    "Aegwynn",
    "Anetheron",
    "Anub'arak",
    "Arthas",
    "Azshara",
    "Blackmoore",
    "Blackrock",
    "Blutkessel",
    "Dalvengyr",
    "Destromath",
    "Dethecus",
    "Echsenkessel",
    "Eredar",
    "FestungderStürme",
    "Frostmourne",
    "Frostwolf",
    "Gorgonnash",
    "Gul'dan",
    "Kel'Thuzad",
    "Kil'Jaeden",
    "Krag'jin",
    "Mal'Ganis",
    "Mannoroth",
    "Mug'thol",
    "Nathrezim",
    "Nazjatar",
    "Nefarian",
    "Nera'thor",
    "Onyxia",
    "Rajaxx",
    "Taerar",
    "Terrordar",
    "Theradras",
    "Tichondrius",
    "Un'Goro",
    "Vek'lor",
    "Wrathbringer",
    "Zuluhed",
    "DerMithrilorden",
    "DerRatvonDalaran",
    "DieAldor",
    "DieewigeWacht",
    "DieNachtwache",
    "DieSilberneHand",
    "Forscherliga",
    "Todeswache",
    "ZirkeldesCenarius",
    "DasKonsortium",
    "DasSyndikat",
    "DerabyssischeRat",
    "DieArguswacht",
    "DieTodeskrallen",
    "KultderVerdammten",
    "ColinasPardas",
    "Exodar",
    "LosErrantes",
    "Minahonda",
    "Tyrande",
    "C'Thun",
    "DunModr",
    "Sanguino",
    "Shen'dralar",
    "Uldum",
    "Zul'jin",
    "Pozzo",
    "Nemesis"
]

const self = module.exports = {
    name: 'mplus',
    description: 'Start Mythic Plus boost',
    run: async (client, message, args) => {
        if (message.channel.id !== channels['system-create-boost']) return;

        const mythicPlusBoostSchema = {
            "id": "/MythicPlusBoost",
            "type": "object",
            "properties": {
                "name": { "type": "string" },
                "realm": { "type": "string" },
                "source": { "$ref": "/MythicPlusSourcesEnum" },
                "payments": { "$ref": "/MythicPlusPaymentsSchema" },
                "paidBalance": { "type": "number" | null },
                "discount": { "type": "number" | null },
                "stack": { "$ref": "/MythicPlusStacksEnum" },
                "keys": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "dungeon": { "$ref": "/MythicPlusDungeonsEnum" },
                            "level": { "type": "number" | "string" | null },
                            "timed": { "type": "boolean" },
                            "booster": {
                                "type": "object" | null,
                                "items": { "$ref": "/MythicPlusRolesEnum" }
                            },
                        },
                    },
                    "minItems": 1,
                    "maxItems": 4
                },
                "advertiser": { "$ref": "/MythicPlusAdvertiserSchema" },
                "notes": { "type": "string" }
            },
            "required": ["name", "realm", "source", "payments", "discount", "paidBalance", "keys", "stack", "notes"]
        };

        const advertiserSchema = {
            "id": "/MythicPlusAdvertiserSchema",
            "type": "object",
            "items": {
                "advertiserId": { "type": "string" },
                "playing": { "type": "boolean" },
                "role": {
                    "type": "string",
                    "enum": ["Tank", "Healer", "DPS"]
                },
            },
            "required": ["advertiserId"]
        }


        const sourceEnum = {
            "id": "/MythicPlusSourcesEnum",
            "type": "string",
            "items": {
                "source": {
                    "type": "string",
                    "enum": ["TC", "TCL", "TIH", "D"]
                }
            },
        }

        const dungeonEnum = {
            "id": "/MythicPlusDungeonsEnum",
            "type": "string",
            "items": {
                "dungeon": {
                    "type": "string",
                    "enum": ["ANY", "DOS", "HOA", "MISTS", "PLAGUE", "SD", "SOA", "TNW", "TOP", "TAZ"]
                }
            }
        }

        const roleEnum = {
            "id": "/MythicPlusRolesEnum",
            "type": "object",
            "items": {
                "boosterId": { "type": "string" },
                "role": {
                    "type": "string",
                    "enum": ["Tank", "Healer", "DPS"]
                }
            }
        }

        const paymentsSchema = {
            "id": "/MythicPlusPaymentsSchema",
            "type": "array",
            "items": {
                "type": "object",
                "items": {
                    "amount": { "type": "number" },
                    "realm": { "type": "string" },
                    "faction": { "type": "string", "enum": ["HORDE", "ALLIANCE"] },
                    "collectorId": { "type": "string" }
                },
                "required": ["amount", "realm", "faction", "collectorId"]
            },
            "minItems": 1,
        }

        const stackEnum = {
            "id": "/MythicPlusStacksEnum",
            "type": "array",
            "items": {
                "stack": {
                    "type": "string",
                    "enum": [
                        "Cloth",
                        "Leather",
                        "Mail",
                        "Plate",
                        "Mage",
                        "Priest",
                        "Warlock",
                        "Demon Hunter",
                        "Druid",
                        "Monk",
                        "Rogue",
                        "Hunter",
                        "Shaman",
                        "Death Knight",
                        "Paladin",
                        "Warrior"
                    ]
                },
            }
        }

        const msgBoost = new MythicPlus();

        const data = message.content.replace('!boost ', '');
        const parsedData = JSON.parse(data);

        v.addSchema(mythicPlusBoostSchema, '/MythicPlusBoost');
        v.addSchema(advertiserSchema, '/MythicPlusAdvertiserSchema');
        v.addSchema(sourceEnum, '/MythicPlusSourcesEnum');
        v.addSchema(dungeonEnum, '/MythicPlusDungeonsEnum');
        v.addSchema(paymentsSchema, '/MythicPlusPaymentsSchema');
        v.addSchema(roleEnum, '/MythicPlusRolesEnum');
        v.addSchema(stackEnum, '/MythicPlusStacksEnum');
        if (!v.validate(parsedData, mythicPlusBoostSchema).valid) {
            console.log(v.validate(parsedData, mythicPlusBoostSchema));
            return message.reply({ content: `The boost string I received was invalid` });
        }

        // charToWhisper AKA name-realm
        const charToWhisper = `${parsedData.name}-${parsedData.realm}`.replace(/ +/g, '');
        msgBoost.charToWhisper = charToWhisper;

        // Source
        const source = parsedData.source.toUpperCase();
        msgBoost.source = sources[source];

        // Paid array
        for (let paid of parsedData.payments) {
            const { amount, realm } = paid;

            let simRealmArr = [];
            let simArr = [];
            realmsArr.forEach(simRealm => {
                const similarityValue = self.similarity(simRealm, realm);
                simArr.push(similarityValue);
                simRealmArr[similarityValue] = simRealm;
            })
            msgBoost.payments.push({
                amount: amount,
                realm: simRealmArr[Math.max(...simArr)],
                faction: paid.faction,
                collectorId: paid.collectorId
            });
        }

        // Discount from adv cut
        const discount = parsedData.discount;
        if (discount) {
            msgBoost.discount = parsedData.discount;
        }

        // Total pot
        msgBoost.totalPot = msgBoost.payments.reduce((prev, curr) => prev + curr.amount, 0);

        // Keys
        const keys = parsedData.keys;

        // const invalidTankAmount = keys.filter((key) => key.booster?.role === 'Tank').length > 1
        // const invalidHealerAmount = keys.filter((key) => key.booster?.role === 'Healer').length > 1
        // const invalidDpsAmount = keys.filter((key) => key.booster?.role === 'DPS').length > 2
        // // If any is true, too many boosters are assigned for the same slot
        // if (invalidTankAmount || invalidHealerAmount || invalidDpsAmount) {
        // 	return message.reply({ content: `Too many boosters assigned to the same slot` });
        // }

        const playAlongRole = parsedData.advertiser.playing ? parsedData.advertiser.role : null;
        const tanks = new Set(parsedData.keys
            .filter(key => key.booster?.boosterId && key.booster?.role && key.booster?.role === 'Tank')
            .map(key => key.booster?.boosterId));
        const healers = new Set(parsedData.keys
            .filter(key => key.booster?.boosterId && key.booster?.role && key.booster?.role === 'Healer')
            .map(key => key.booster?.boosterId));
        const dps = new Set(parsedData.keys
            .filter(key => key.booster?.boosterId && key.booster?.role && key.booster?.role === 'DPS')
            .map(key => key.booster?.boosterId));

        if (playAlongRole === 'Tank') tanks.add(parsedData.advertiser.advertiserId);
        if (playAlongRole === 'Healer') healers.add(parsedData.advertiser.advertiserId);
        if (playAlongRole === 'DPS') dps.add(parsedData.advertiser.advertiserId);

        if (tanks.size > 1) {
            return message.reply({ content: `Only one user can be tank` });
        }
        if (healers.size > 1) {
            return message.reply({ content: `Only one user can be healer` });
        }
        if (dps.size > 2) {
            return message.reply({ content: `Only two users can be DPS` });
        }



        // Timed
        const findKey = (prev, curr) => prev && prev.level > curr.level ? prev : curr;
        msgBoost.timed = keys.some(key => key.timed) ? keys.filter(key => key.timed).reduce(findKey, null).timed : keys.reduce(findKey, null).timed;

        // Set currentStack
        keys.some(key => key.timed)
            ? msgBoost.currentStack = msgBoost.getCurrentStack(keys.filter(key => key.timed).reduce(findKey, null).level)
            : msgBoost.currentStack = msgBoost.getCurrentStack(keys.reduce(findKey, null).level);

        // Stack
        const stack = parsedData.stack;
        msgBoost.armorStack = await utils.armorStackRole(stack, msgBoost);
        msgBoost.armorStackName = stack;

        const isEnoughKeyholders = (keys) => {
            const specificKeys = keys.filter((key) => key.dungeon.toLowerCase() !== 'any')?.length;
            const specificKeysBoosters = keys.filter((key) => key.booster?.boosterId && key.dungeon.toLowerCase() !== 'any')?.length;
            return (specificKeys >= 2 && specificKeys === specificKeysBoosters) || specificKeys <= 1;
        }
        if (!isEnoughKeyholders(keys)) {
            return message.reply({ content: `More than 2 specific keys requires keyholders to be pre-assigned` });
        }

        for (let key of keys) {
            const isValidDungeon = dungeons.hasOwnProperty(key.dungeon.toUpperCase());
            const isValidLevel = ((/[0-9]+/).test(key.level) && key.level <= 30) || (/MYTHIC|HARD_MODE/i).test(key.level);
            if (!isValidLevel || !isValidDungeon) {
                return message.reply({ content: `Invalid key properties, received: \`${key.dungeon.toUpperCase()}\`, \`${key.level}\`` });
            }
            if (key.booster) {
                try {
                    msgBoost.assignBooster(key, message.guild);
                } catch (err) {
                    return message.reply({ content: `Error adding booster: ${err.message}` });
                }

            }
        }
        msgBoost.keys = keys;
        msgBoost.amountKeys = keys.length;
        keys.length === 1
            ? msgBoost.keyLvl.push(keys[0].level)
            : msgBoost.keyLvl = keys.map(key => key.level);

        // Advertiser information
        msgBoost.advertiser = message.guild.members.cache.get(parsedData.advertiser.advertiserId);
        if (parsedData.advertiser.playing) {
            try {
                msgBoost.assignSelfplay(parsedData);
            } catch (err) {
                console.log(err);
                return message.reply({ content: `Failed to assign a selfplay position: \`${err.message}\`` });
            }
        }

        // Notes
        msgBoost.note = parsedData.notes;

        msgBoost.date = msgBoost.getDate();

        // Trial advertiser
        if (await utils.isTrialAdvertiser(msgBoost.advertiser)) {
            msgBoost.isTrial = true;
        }

        // Balance remove if paid with balance

        // Advertiser balance remove if discount given
        if (parsedData.discount) {
            await Sheet.removeBalance(msgBoost.advertiser, parsedData.discount * -1, message.guild, 'Advertiser mplus disocunt')
                .catch(err => {
                    console.log(`Failed to remove balance for discount: ${err}`);
                    embeds.boostLoggingEmbed(client, `**Failed to remove balance for mplus discount from ${msgBoost.advertiser}**`);
                });
        }

        msgBoost.splitPot();

        await utils.createMplusChannel(message, msgBoost)

        const rolesToPing = await msgBoost.getRolesToPing();

        const boostEmbed = await msgBoost.channel.send({ content: rolesToPing, embeds: [msgBoost.createEmbed()] }).catch(err => { console.log(err) });

        message.react('✅');

        msgBoost.boostMessage = boostEmbed;
        msgBoost.messageId = boostEmbed.id;

        await boostEmbed.edit({ embeds: [msgBoost.createEmbed().setColor(creatingColor)] });

        boostHashMap.set(boostEmbed.id, msgBoost);

        embeds.boostLoggingEmbed(client, `${message.author} \`created\` a boost with the ID \`${msgBoost.messageId}\``)

        boostEmbed.pin()

        if (msgBoost.isTrial) {
            const collectorChannel = utils.getChannelById(message.guild, channels['collections'])
            const collectorMessage = self.embedToCollectingChannel(msgBoost);
            const embedCollectMessage = new MessageEmbed(collectorMessage);

            const msg = await collectorChannel.send({ content: `<@&${roles.Collector}>`, embeds: [embedCollectMessage] });
            await msg.react(emojis.moneyBag);
            await msg.react('✋');
            collectorHashMap.set(msg.id, boostEmbed.id);
            msgBoost.collectorMessage = msg;
        }

        if (msgBoost.keys.filter(key => key.dungeon.toLowerCase() !== 'any').length > 1) {
            if (!msgBoost.tank) {
                await boostEmbed.react(emojis.tank);
            }
            if (!msgBoost.healer) {
                await boostEmbed.react(emojis.healer);
            }
            if (!msgBoost.dps1 || !msgBoost.dps2) {
                await boostEmbed.react(emojis.dps);
            }
        } else {
            await boostEmbed.react(emojis.tank);
            await boostEmbed.react(emojis.healer);
            await boostEmbed.react(emojis.dps);
        }

        // const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        // for (let i = 0; i < keys.length; i++) {
        // 	if (keys[i].dungeon === 'Any') continue;
        // 	await boostEmbed.react(reactions[i]);
        // }

        if (msgBoost.keys.filter(key => key.dungeon !== 'Any')?.length === 1) {
            await boostEmbed.react(emojis.keystone);
            await boostEmbed.react(emojis.moneyBag);
            if (msgBoost.currentStack >= thresholds.Timed_MidKeyBooster || msgBoost.currentStack >= thresholds.Untimed_MidKeyBooster) {
                await boostEmbed.react(emojis.changeChannel);
            }
            await boostEmbed.react(emojis.teamTake);
            await boostEmbed.react(emojis.cancelBoost);
        } else {
            await boostEmbed.react(emojis.moneyBag);
            if (msgBoost.currentStack >= thresholds.Timed_MidKeyBooster || msgBoost.currentStack >= thresholds.Untimed_MidKeyBooster) {
                await boostEmbed.react(emojis.changeChannel);
            }
            await boostEmbed.react(emojis.teamTake);
            await boostEmbed.react(emojis.cancelBoost);
        }
    },

    embedToCollectingChannel(msgBoost) {
        let collector;
        if (!msgBoost.collector && !msgBoost.onTheWay) {
            collector = "Waiting for Collector";
        } else if (msgBoost.onTheWay) {
            collector = `✋ ${msgBoost.onTheWay}`;
        } else {
            collector = msgBoost.collector
        }
        const embed = {
            'title': 'Gold Collecting Mythic Plus Boost',
            'color': '#DD0044',
            'fields': [
                {
                    'name': 'Author',
                    'value': `${msgBoost.advertiser}`,
                    'inline': true,
                },
                {
                    'name': 'Realm',
                    'value': `${msgBoost.goldOn}`,
                    'inline': true,
                },
                {
                    'name': 'Amount',
                    'value': `<:gold:845378897893523517>${numeral(msgBoost.totalPot).format('0,0')}`,
                    'inline': true,
                },
                {
                    'name': 'Channel',
                    'value': `${msgBoost.boostMessage.channel}`
                },
                {
                    'name': 'Link',
                    'value': `https://discord.com/channels/693420859930443786/${msgBoost.boostMessage.channel.id}/${msgBoost.messageId}`,
                    'inline': true,
                },
                {
                    'name': 'Collector',
                    'value': `${collector}`,
                    'inline': true,
                }
            ],
        };

        return embed;
    },
    similarity(s1, s2) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - self.editDistance(longer, shorter)) / parseFloat(longerLength);
    },
    editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
            var lastValue = i;
            for (var j = 0; j <= s2.length; j++) {
                if (i == 0) {
                    costs[j] = j;
                }
                else {
                    if (j > 0) {
                        var newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length] = lastValue;
            }
        }
        return costs[s2.length];
    },
};
