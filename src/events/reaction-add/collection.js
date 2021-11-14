const { MessageEmbed } = require('discord.js');
const emotes = require('../../JSON/emotes.json');
const utils = require('../../common/utils/utils');
const boostMap = require('../../models/maps/boosts');
const collectorMap = require('../../models/maps/collections');
const boosts = require('../../commands/boost/mplus');

module.exports = async (client, message, channel, emoji, user) => {

    const collectorBoostId = collectorMap.get(message.id);
    const boostMsg = boostMap.get(collectorBoostId);

    if (!boostMsg) return;

    user = message.guild.members.cache.get(user.id);

    if (boostMsg !== undefined) {
        switch (emoji) {
            case emotes.goldCollectedAndStart:
                if ((await utils.isCollectorOrAbove(message.guild.members.cache.get(user.id)) && !boostMsg.collector && boostMsg.onTheWay === user) || await utils.isManagerOrAbove(message.guild.members.cache.get(user.id))) {
                    boostMsg.onTheWay = ''
                    boostMsg.collector = user

                    const collectorEmbed = boosts.embedToCollectingChannel(boostMsg);
                    message.edit({ embeds: [new MessageEmbed(collectorEmbed)] });

                    boostMsg.boostMessage.edit({ embeds: [boostMsg.createEmbed()] })
                    await message.reactions.removeAll();
                } else {
                    await utils.wrongRole(user, message, emoji)
                }
                break;
            case '✋':
                if (!boostMsg.collector && !boostMsg.onTheWay && await utils.isCollectorOrAbove(message.guild.members.cache.get(user.id))) {
                    boostMsg.onTheWay = user

                    const collectorEmbed = boosts.embedToCollectingChannel(boostMsg)
                    message.edit({ embeds: [new MessageEmbed(collectorEmbed)] });

                    boostMsg.boostMessage.edit({ embeds: [boostMsg.createEmbed()] })
                } else {
                    await utils.wrongRole(user, message, emoji)
                }
                break;
            default:
                break
        }
    }
};