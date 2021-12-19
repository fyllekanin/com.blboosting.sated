import {
  Client,
  Emoji,
  GuildEmoji,
  GuildMember,
  GuildTextBasedChannel,
  Message,
  MessageEmbed,
} from 'discord.js';
import Emojis from '../../common/constants/emojis.enum';
import * as utils from '../../common/utils/utils';
import boostMap from '../../models/maps/boost';
import collectionMap from '../../models/maps/collections';
import boosts from '../../commands/boost/mplus';
import MythicPlusBoost from '../../models/boost/MythicPlusBoost';

export const collectionTake = async (
  client: Client,
  message: Message,
  channel: GuildTextBasedChannel,
  emoji: Emoji | GuildEmoji | string,
  user: GuildMember
): Promise<void> => {
  const collectorBoostId = collectionMap.get(message.id);
  const boostMsg: MythicPlusBoost = boostMap.get(collectorBoostId);
  if (!boostMsg) return;

  user = message.guild.members.cache.get(user.id);

  switch (emoji) {
    case Emojis.moneyBag:
      if (
        (!(await utils.isCollectorOrAbove(user)) ||
          boostMsg.collector ||
          boostMsg.onTheWay !== user) &&
        !(await utils.isManagerOrAbove(
          message.guild.members.cache.get(user.id)
        ))
      ) {
        await utils.wrongRole(user, message, emoji);
      }

      boostMsg.onTheWay = '';
      boostMsg.collector = user;

      const collectorEmbed: MessageEmbed =
        boosts.embedToCollectingChannel(boostMsg);
      message.edit({ embeds: [new MessageEmbed(collectorEmbed)] });

      boostMsg.message.edit({ embeds: [boostMsg.createEmbed()] });
      await message.reactions.removeAll();

      break;
    case Emojis.onTheWay:
      if (
        boostMsg.collector ||
        boostMsg.onTheWay ||
        !(await utils.isCollectorOrAbove(
          message.guild.members.cache.get(user.id)
        ))
      ) {
        await utils.wrongRole(user, message, emoji);
      }

      boostMsg.onTheWay = user;

      const collectorEmbed: MessageEmbed =
        boosts.embedToCollectingChannel(boostMsg);
      message.edit({ embeds: [new MessageEmbed(collectorEmbed)] });

      boostMsg.message.edit({ embeds: [boostMsg.createEmbed()] });
      break;
    default:
      break;
  }
};
