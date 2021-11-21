const { MessageEmbed } = require('discord.js');
const utils = require('../common/utils/utils');
const boostMap = require('../models/maps/boosts');
const embeds = require('../common/utils/embeds');

module.exports = async (client, interaction) => {
    if (!await utils.isAdvertiserOrAbove(interaction.member)) return interaction.reply({ content: `Unauthorized`, ephemeral: true })

    await interaction.deferReply({ ephemeral: true });

    const options = interaction.options._hoistedOptions;

    const boostId = options.find(option => option.name === 'boost-id')?.value.match(/[0-9]+/)?.[0];
    if (!boostId) {
        return interaction.editReply({ content: 'Invalid boost ID provided.', ephemeral: true });
    };

    const boostMsg = boostMap.get(boostId);
    if (!boostMsg) {
        return interaction.editReply({ content: `Couldn't find boost with the ID \`${boostId}\`.`, ephemeral: true });
    };

    const boosterIn = options.find(option => option.name === 'booster')?.member;

    // const reason = options.find(option => option.name === 'reason')?.value;

    switch (interaction.options._subcommand) {
        case 'replace':
            const slot = options.find(option => option.name === 'slot')?.value;
            let boosterOut

            switch (slot.toUpperCase()) {
                case 'TANK':
                    boosterOut = boostMsg.tank;
                    boostMsg.tank = boosterIn;
                    break;
                case 'HEALER':
                    boosterOut = boostMsg.healer;
                    boostMsg.healer = boosterIn;
                    break;
                case 'DPS1':
                    boosterOut = boostMsg.dps1;
                    boostMsg.dps1 = boosterIn;
                    break;
                case 'DPS2':
                    boosterOut = boostMsg.dps2;
                    boostMsg.dps2 = boosterIn;
                    break;
                default:
                    return interaction.editReply({ content: `Error trying to resolve the slot to fill`, ephemeral: true })
            }

            if (boostMsg.keystoneUser === boosterOut) {
                boostMsg.keystoneUser = boosterIn
            }

            // Update voice permissions
            await boostMsg.voiceChannel?.permissionOverwrites.delete(boosterOut?.id);
            await boostMsg.voiceChannel?.permissionOverwrites.edit(boosterIn.id, {
                CONNECT: true,
                SPEAK: true,
                USE_VAD: true,
                VIEW_CHANNEL: true,
                STREAM: true,
            });

            // boosterOut can either be a user or empty string
            if (boosterOut) {
                // If a booster was replaced in that slot, send following log & reply
                // embeds.boostReplacementEmbed(client, boostMsg, reason, boosterIn, boosterOut, slot);
                embeds.boostLoggingEmbed(client, `${interaction.user} \`replaced\` booster ${boosterOut} with booster ${boosterIn} in slot \`${slot}\``);
                interaction.editReply({ content: `Replaced ${boosterOut} with ${boosterIn}`, ephemeral: true });
            } else {
                // If an empty slot was filled, send following log
                embeds.boostLoggingEmbed(client, `${interaction.user} \`filled\` slot \`${slot}\` with booster ${boosterIn}`);
                interaction.editReply({ content: `Filled ${slot} with ${boosterIn}`, ephemeral: true });
            }

            break;
        case 'delete':
            if (!await utils.isManagerOrAbove(interaction.member)) return interaction.editReply({ content: `Unauthorized`, ephemeral: true })

            boostMap.delete(boostId)
            return interaction.editReply({ content: `Deleted boost \`${boostId}\` from the memory.` })
    }
    // Edit the boost to display the new boosters
    !boostMsg?.isTeamClaimed
        ? boostMsg?.boostMessage.edit({ embeds: [boostMsg.createEmbed()] })
        : boostMsg?.boostMessage.edit({ embeds: [boostMsg.createTeamEmbed(boostMsg.boostMessage)] })
}