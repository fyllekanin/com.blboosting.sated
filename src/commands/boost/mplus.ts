import { Booster } from './../../interface/keys.interface';
import { Faction } from './../../common/enums/faction.enum';
import { Stacks } from './../../common/enums/stacks.enum';
import { Payments } from './../../interface/payments.interface';
import { IMythicPlus } from './../../interface/mythicplus.interface';
import { Client, Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';

import MythicPlusBoost from '../../models/boost/MythicPlusBoost';

import boostMap from '../../models/maps/boost';
import collectorMap from '../../models/maps/collections';

const Validator = require('jsonschema').Validator;
const v = new Validator();

import Dungeons from '../../common/enums/dungeons.enum';
import Sources from '../../common/enums/sources.enum';
import { Roles } from '../../common/constants/guildroles.constants';
import { Channels } from '../../common/constants/channels.enum';
import {Emojis} from '../../common/constants/emojis.enum';
import { Realms } from '../../common/constants/realms';
import * as utils from '../../common/utils/utils';
import * as embeds from '../../common/utils/embeds';
import numeral from 'numeral';
import { thresholds } from '../../JSON/thresholds';
import * as Sheet from '../../services/spreadsheet';
import IKeys from '../../interface/keys.interface';

export const self = {
  name: 'mplus',
  description: 'Create a new Mythic Plus boost',
  run: async (client: Client, message: Message, args: Array<string>) => {
    if (message.channel.id !== Channels['system-create-boost']) return;

    // @ts-ignore
    const mythicPlusBoostSchema = {
      id: '/MythicPlusBoost',
      type: 'object',
      properties: {
        name: { type: 'string' },
        realm: { type: 'string' },
        source: { $ref: '/MythicPlusSourcesEnum' },
        payments: { $ref: '/MythicPlusPaymentsSchema' },
        // @ts-ignore
        paidBalance: { type: 'number' | null },
        // @ts-ignore
        discount: { type: 'number' | null },
        stack: { $ref: '/MythicPlusStacksEnum' },
        keys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dungeon: { $ref: '/MythicPlusDungeonsEnum' },
              // @ts-ignore
              level: { type: 'number' | 'string' | null },
              timed: { type: 'boolean' },
              booster: {
                // @ts-ignore
                type: 'object' | null,
                items: { $ref: '/MythicPlusRolesEnum' },
              },
            },
          },
          minItems: 1,
          maxItems: 4,
        },
        advertiser: { $ref: '/MythicPlusAdvertiserSchema' },
        notes: { type: 'string' },
      },
      required: [
        'name',
        'realm',
        'source',
        'payments',
        'discount',
        'paidBalance',
        'keys',
        'stack',
        'notes',
      ],
    };

    const advertiserSchema = {
      id: '/MythicPlusAdvertiserSchema',
      type: 'object',
      items: {
        advertiserId: { type: 'string' },
        playing: { type: 'boolean' },
        role: {
          type: 'string',
          enum: ['Tank', 'Healer', 'DPS'],
        },
      },
      required: ['advertiserId'],
    };

    const sourceEnum = {
      id: '/MythicPlusSourcesEnum',
      type: 'string',
      items: {
        source: {
          type: 'string',
          enum: ['TC', 'TCL', 'TIH', 'D'],
        },
      },
    };

    const dungeonEnum = {
      id: '/MythicPlusDungeonsEnum',
      type: 'string',
      items: {
        dungeon: {
          type: 'string',
          enum: [
            'ANY',
            'DOS',
            'HOA',
            'MISTS',
            'PLAGUE',
            'SD',
            'SOA',
            'TNW',
            'TOP',
            'TAZ',
          ],
        },
      },
    };

    const roleEnum = {
      id: '/MythicPlusRolesEnum',
      type: 'object',
      items: {
        boosterId: { type: 'string' },
        role: {
          type: 'string',
          enum: ['Tank', 'Healer', 'DPS'],
        },
      },
    };

    const paymentsSchema = {
      id: '/MythicPlusPaymentsSchema',
      type: 'array',
      items: {
        type: 'object',
        items: {
          amount: { type: 'number' },
          realm: { type: 'string' },
          faction: { type: 'string', enum: ['HORDE', 'ALLIANCE'] },
          collectorId: { type: 'string' },
        },
        required: ['amount', 'realm', 'faction', 'collectorId'],
      },
    };

    const stackEnum = {
      id: '/MythicPlusStacksEnum',
      type: 'array',
      items: {
        stack: {
          type: 'string',
          enum: [
            'Cloth',
            'Leather',
            'Mail',
            'Plate',
            'Mage',
            'Priest',
            'Warlock',
            'Demon Hunter',
            'Druid',
            'Monk',
            'Rogue',
            'Hunter',
            'Shaman',
            'Death Knight',
            'Paladin',
            'Warrior',
          ],
        },
      },
    };

    const boost = new MythicPlusBoost();

    const data = message.content.replace('!mplus ', '');
    const parsedData: IMythicPlus = JSON.parse(data);

    v.addSchema(mythicPlusBoostSchema, '/MythicPlusBoost');
    v.addSchema(advertiserSchema, '/MythicPlusAdvertiserSchema');
    v.addSchema(sourceEnum, '/MythicPlusSourcesEnum');
    v.addSchema(dungeonEnum, '/MythicPlusDungeonsEnum');
    v.addSchema(paymentsSchema, '/MythicPlusPaymentsSchema');
    v.addSchema(roleEnum, '/MythicPlusRolesEnum');
    v.addSchema(stackEnum, '/MythicPlusStacksEnum');
    if (!v.validate(parsedData, mythicPlusBoostSchema).valid) {
      console.log(v.validate(parsedData, mythicPlusBoostSchema));
      return message.reply({
        content: `The boost string I received was invalid`,
      });
    }

    // charToWhisper AKA name-realm
    const charToWhisper = `${parsedData.name}-${parsedData.realm}`.replace(
      / +/g,
      ''
    );
    boost.contactCharacter = charToWhisper;

    // Source
    boost.source = <Sources>parsedData.source.toUpperCase();

    // Paid array
    for (let paid of parsedData.payments) {
      const { amount, realm } = paid;

      let simRealmArr: any[] = [];
      let simArr: number[] = [];
      Realms.forEach((simRealm) => {
        const similarityValue = self.similarity(simRealm, realm);
        simArr.push(similarityValue);
        simRealmArr[similarityValue] = simRealm;
      });
      boost.payments.push({
        amount: amount,
        realm: simRealmArr[Math.max(...simArr)],
        faction: paid.faction,
        collectorId: paid.collectorId,
      });
    }

    // Discount from adv cut
    const discount = parsedData.discount;
    if (discount) {
      boost.discount = parsedData.discount;
    }

    // Balance remove if paid with balance
    if (parsedData.paidBalance) {
      boost.payments.push({
        amount: parsedData.paidBalance,
        realm: 'Balance',
      });
    }

    // Total pot
    boost.totalPot = parsedData.payments.reduce(
      (prev: number, curr: Payments) => prev + curr.amount,
      0
    );

    // Keys
    const keys = parsedData.keys;

    // const invalidTankAmount = keys.filter((key) => key.booster?.role === 'Tank').length > 1
    // const invalidHealerAmount = keys.filter((key) => key.booster?.role === 'Healer').length > 1
    // const invalidDpsAmount = keys.filter((key) => key.booster?.role === 'DPS').length > 2
    // // If any is true, too many boosters are assigned for the same slot
    // if (invalidTankAmount || invalidHealerAmount || invalidDpsAmount) {
    // 	return message.reply({ content: `Too many boosters assigned to the same slot` });
    // }

    const playAlongRole = parsedData.advertiser.playing
      ? parsedData.advertiser.role
      : null;
    const tanks = new Set(
      parsedData.keys
        .filter(
          (key) =>
            key.booster?.boosterId &&
            key.booster?.role &&
            key.booster?.role === 'Tank'
        )
        .map((key) => key.booster?.boosterId)
    );
    const healers = new Set(
      parsedData.keys
        .filter(
          (key) =>
            key.booster?.boosterId &&
            key.booster?.role &&
            key.booster?.role === 'Healer'
        )
        .map((key) => key.booster?.boosterId)
    );
    const dps = new Set(
      parsedData.keys
        .filter(
          (key) =>
            key.booster?.boosterId &&
            key.booster?.role &&
            key.booster?.role === 'DPS'
        )
        .map((key) => key.booster?.boosterId)
    );

    if (playAlongRole === 'Tank') tanks.add(parsedData.advertiser.advertiserId);
    if (playAlongRole === 'Healer')
      healers.add(parsedData.advertiser.advertiserId);
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
    const findKey = (prev: IKeys, curr: IKeys) =>
      prev && prev.level > curr.level ? prev : curr;
    boost.timed = keys.some((key) => key.timed)
      ? keys.filter((key) => key.timed).reduce(findKey, null).timed
      : keys.reduce(findKey, null).timed;

    // Set currentStack
    keys.some((key) => key.timed)
      ? (boost.lowestSignableRoleThreshold = boost.getCurrentThreshold(
          keys.filter((key) => key.timed).reduce(findKey, null).level
        ))
      : (boost.lowestSignableRoleThreshold = boost.getCurrentThreshold(
          keys.reduce(findKey, null).level
        ));

    // Stack
    const stack = parsedData.stack;
    boost.armorStack = await utils.armorStackRole(stack, boost);
    boost.armorStackName = stack;

    const isEnoughKeyholders = (keys: IKeys[]) => {
      const specificKeys = keys.filter(
        (key) => key.dungeon.toLowerCase() !== 'any'
      )?.length;
      const specificKeysBoosters = keys.filter(
        (key) => key.booster?.boosterId && key.dungeon.toLowerCase() !== 'any'
      )?.length;
      return (
        (specificKeys >= 2 && specificKeys === specificKeysBoosters) ||
        specificKeys <= 1
      );
    };
    if (!isEnoughKeyholders(keys)) {
      return message.reply({
        content: `More than 2 specific keys requires keyholders to be pre-assigned`,
      });
    }

    for (let key of keys) {
      const isValidDungeon = Dungeons.hasOwnProperty(key.dungeon.toUpperCase());
      const isValidLevel =
        (/[0-9]+/.test(key.level.toString()) && key.level <= 30) ||
        /MYTHIC|HARD_MODE/i.test(key.level.toString());
      if (!isValidLevel || !isValidDungeon) {
        return message.reply({
          content: `Invalid key properties, received: \`${key.dungeon.toUpperCase()}\`, \`${
            key.level
          }\``,
        });
      }
      if (key.booster) {
        try {
          boost.assignBooster(key);
        } catch (err) {
          return message.reply({
            content: `Error adding booster: ${err.message}`,
          });
        }
      }
    }
    boost.keys = keys;
    boost.amountKeys = keys.length;
    keys.length === 1
      ? boost.keyLevel.push(keys[0].level)
      : (boost.keyLevel = keys.map((key) => key.level));

    // Advertiser information
    boost.advertiser = message.guild.members.cache.get(
      parsedData.advertiser.advertiserId
    );
    if (parsedData.advertiser.playing) {
      try {
        boost.assignSelfplay(parsedData);
      } catch (err) {
        console.log(err);
        return message.reply({
          content: `Failed to assign a selfplay position: \`${err.message}\``,
        });
      }
    }

    // Notes
    boost.note = parsedData.notes;

    boost.date = boost.getDate();

    // Trial advertiser
    if (await utils.isTrialAdvertiser(boost.advertiser)) {
      boost.isTrial = true;
    }

    // Advertiser balance remove if discount given
    if (parsedData.discount) {
      await Sheet.removeBalance(
        boost.advertiser,
        parsedData.discount * -1,
        message.guild,
        'Advertiser mplus disocunt'
      ).catch((err) => {
        console.log(`Failed to remove balance for discount: ${err}`);
        embeds.boostLoggingEmbed(
          client,
          `**Failed to remove balance for mplus discount from ${boost.advertiser}**`
        );
      });
    }

    boost.setBoosterCut();

    await utils.createMplusChannel(message, boost);

    const rolesToPing = await boost.getRolesToPing();
    const boostEmbed = (await boost.channel
      .send({ content: rolesToPing, embeds: [boost.createEmbed()] })
      .catch((err) => {
        console.log(err);
      })) as Message;

    // React on JSON data message to let System know that the boost is created successfully
    await message.react('✅');

    boost.message = boostEmbed;
    boost.boostId = boostEmbed.id;

    await boostEmbed.edit({
      embeds: [boost.createEmbed().setColor(boost.creatingColor)],
    });

    boostMap.set(boostEmbed.id, boost);

    embeds.boostLoggingEmbed(
      client,
      `${message.author} \`created\` a boost with the ID \`${boost.boostId}\``
    );

    boostEmbed.pin();

    if (boost.isTrial) {
      const collectorChannel = utils.getChannelById(
        message.guild,
        Channels['collections']
      );
      const collectionEmbedTemplate = self.sendCollectionEmbed(boost);
      const collectionEmbed = new MessageEmbed(collectionEmbedTemplate);

      const collectionMessage = (await collectorChannel.send({
        content: `<@&${Roles.Collector}>`,
        embeds: [collectionEmbed],
      })) as Message;

      await collectionMessage.react(Emojis.moneyBag);
      await collectionMessage.react('✋');

      collectorMap.set(collectionMessage.id, boostEmbed.id);
      boost.collectionMessage = collectionMessage;
    }

    if (
      boost.keys.filter((key) => key.dungeon.toLowerCase() !== 'any').length > 1
    ) {
      if (!boost.tank) {
        await boostEmbed.react(Emojis.tank);
      }
      if (!boost.healer) {
        await boostEmbed.react(Emojis.healer);
      }
      if (!boost.dps1 || !boost.dps2) {
        await boostEmbed.react(Emojis.dps);
      }
    } else {
      await boostEmbed.react(Emojis.tank);
      await boostEmbed.react(Emojis.healer);
      await boostEmbed.react(Emojis.dps);
    }

    // const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    // for (let i = 0; i < keys.length; i++) {
    // 	if (keys[i].dungeon === 'Any') continue;
    // 	await boostEmbed.react(reactions[i]);
    // }

    if (boost.keys.filter((key) => key.dungeon !== 'Any')?.length === 1) {
      await boostEmbed.react(Emojis.keystone);
      await boostEmbed.react(Emojis.moneyBag);
      if (
        boost.lowestSignableRoleThreshold >= thresholds.Timed_MidKeyBooster ||
        boost.lowestSignableRoleThreshold >= thresholds.Untimed_MidKeyBooster
      ) {
        await boostEmbed.react(Emojis.changeChannel);
      }
      await boostEmbed.react(Emojis.teamTake);
      await boostEmbed.react(Emojis.cancelBoost);
    } else {
      await boostEmbed.react(Emojis.moneyBag);
      if (
        boost.lowestSignableRoleThreshold >= thresholds.Timed_MidKeyBooster ||
        boost.lowestSignableRoleThreshold >= thresholds.Untimed_MidKeyBooster
      ) {
        await boostEmbed.react(Emojis.changeChannel);
      }
      await boostEmbed.react(Emojis.teamTake);
      await boostEmbed.react(Emojis.cancelBoost);
    }
  },

  sendCollectionEmbed(boost: MythicPlusBoost) {
    let collector;
    if (!boost.collector && !boost.onTheWay) {
      collector = 'Waiting for Collector';
    } else if (boost.onTheWay) {
      collector = `✋ ${boost.onTheWay}`;
    } else {
      collector = boost.collector;
    }
    return {
      title: `${Emojis.moneyBag} Collection Mythic Plus Boost ${Emojis.moneyBag}`,
      color: boost.creatingColor,
      fields: [
        {
          name: 'Author',
          value: `${boost.advertiser}`,
          inline: true,
        },
        {
          name: 'Realm(s)',
          value: `${boost.payments
            .map((payment: Payments) => payment.realm)
            .join(',\n')}`,
          inline: true,
        },
        {
          name: 'Amount',
          value: `<:gold:${Emojis.gold}>${numeral(boost.totalPot).format(
            '0,0'
          )}`,
          inline: true,
        },
        {
          name: 'Channel',
          value: `${boost.message.channel}`,
          inline: false,
        },
        {
          name: 'Link',
          value: `https://discord.com/channels/693420859930443786/${boost.message.channel.id}/${boost.boostId}`,
          inline: true,
        },
        {
          name: 'Collector',
          value: `${collector}`,
          inline: true,
        },
      ],
    } as MessageEmbedOptions;
  },
  similarity(s1: string, s2: string) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength: any = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (
      (longerLength - self.editDistance(longer, shorter)) /
      parseFloat(longerLength)
    );
  },
  editDistance(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0) {
          costs[j] = j;
        } else {
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
