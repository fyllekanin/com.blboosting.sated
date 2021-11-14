const { MessageEmbed } = require('discord.js');
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
            case '✋':
                if (boostMsg.onTheWay === user && await utils.isCollectorOrAbove(message.guild.members.cache.get(user.id))) {
                    boostMsg.collector = ''
                    boostMsg.onTheWay = ''

                    const collectorEmbed = boosts.embedToCollectingChannel(boostMsg)
                    message.edit({ embeds: [new MessageEmbed(collectorEmbed)] });

                    boostMsg.boostMessage.edit({ embeds: [boostMsg.createEmbed()] })
                }
                break;
            default:
                break
        }
    }
};