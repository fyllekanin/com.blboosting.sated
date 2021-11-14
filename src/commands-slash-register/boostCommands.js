const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Replace a booster or fill an empty slot (Advertiser / Admin only)')
    .addSubcommand(command =>
        command.setName('replace')
            .setDescription('Replace a booster')
            .addStringOption(option =>
                option.setName('boost-id')
                    .setDescription('The ID of the boost, typically found at the bottom of the boost embed')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('slot')
                    .setDescription('The slot you want to fill')
                    .addChoice('Tank', 'Tank')
                    .addChoice('Healer', 'Healer')
                    .addChoice('DPS1', 'DPS1')
                    .addChoice('DPS2', 'DPS2')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('booster')
                    .setDescription('The booster you\'re filling the slot with')
                    .setRequired(true)
            )
        // .addStringOption(option =>
        //     option.setName('reason')
        //         .setDescription('Please enter the reason for this replacement')
        //         .setRequired(true)
        // )
    )
    .addSubcommand(command =>
        command.setName('delete')
            .setDescription('Delete a boost from the bot memory (Admin only)')
            .addStringOption(option =>
                option.setName('boost-id')
                    .setDescription('The ID of the boost, typically found at the bottom of the boost embed')
                    .setRequired(true)
            )
    )

module.exports = data