const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const utils = require('./utils');
const numeral = require('numeral');
const channels = require('../../JSON/server-info/channels.json');
const Sheet = require('../../services/spreadsheet');

const self = module.exports = {
    greetingPhrase: () => {
        const time = new Date(Date.now()).getHours()

        let greetingPhrase
        if (time >= 0 && time < 6) greetingPhrase = 'Greetings'
        else if (time >= 6 && time < 12) greetingPhrase = 'Good morning'
        else if (time >= 12 && time < 17) greetingPhrase = 'Good day'
        else greetingPhrase = 'Good evening'

        return greetingPhrase
    },

    boostLoggingEmbed: (client, logMessage) => {
        const logsEmbed = new MessageEmbed().setDescription(logMessage).setTimestamp(new Date())
        const logsChannel = client.channels.cache.get(channels['boost-logs'])
        logsChannel.send({ embeds: [logsEmbed] })
    },

    boostReplacementEmbed: (client, boost, replacementMessage, boosterIn, boosterOut, slot) => {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('replacement-deduct')
                    .setLabel('Deduct')
                    .setStyle('SECONDARY')
                    .setEmoji('818854164548812811')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('replacement-ignore')
                    .setLabel('Ignore')
                    .setStyle('SECONDARY')
            );

        const replacementEmbed = new MessageEmbed()
            .setTitle(`${slot} Replacement`)
            .setDescription(`${replacementMessage}`)
            .addField(`Boost ID`, `[${boostMsg.boostId}](${utils.linkBuilder(boost)})`, true)
            .addField(`Booster In`, `${boosterIn}`, true)
            .addField(`Booster Out`, `${boosterOut}`, true)
            .setFooter(`🆔: ${boost.boostId}`)
            .setColor('#FFFF00')
            .setTimestamp(new Date(Date.now()));

        const replacementChannel = client.channels.cache.get(channels['mplus-replacements']);
        replacementChannel.send({ content: '<@&792525584377970709>', embeds: [replacementEmbed], components: [row] });
    },

    mythicPlusPickedEmbed: (boostMsg, user) => {
        const greetingPhrase = self.greetingPhrase()

        const embed = new MessageEmbed()
            .setTitle('Mythic Plus Boost')
            .setDescription(`${greetingPhrase} ${user},

the boost you recently signed for is ready!
When the run is completed, make sure you let ${boostMsg.advertiser} know in order for the run to be processed.

Below you will find some details regarding your run, note that it's mandatory you join the voice channel created for you and your boosting buddies.
Also, make sure you ask the client what loot spec to run and trade them **ALL** items.

Good luck! <:BLSalute:880535565752217611>`)

            .addField('Char to whisper', `\`/w ${boostMsg.charToWhisper} inv\``, true)
            .addField('Boost ID', `[${boostMsg.boostId}](${utils.linkBuilder(boostMsg)})`, true)
            .addField('Voice Channel', `[Join Voice](${boostMsg.voiceCode})`, true)
            // .addField('Service', `<:keystone:${emotes.keystone}> ${boostMsg.keyLvl}`, true)
            .addField('Your Cut', `<:gold:701099811029385226>${numeral(boostMsg.boosterPot).format('0,0')}`, true)

            .setFooter('Bloodlust Boosting', 'https://cdn.discordapp.com/attachments/769522185978511400/882434615107813397/Keys.png')
            .setColor('#ffe100')

        user.send({ embeds: [embed] })
    },

    mythicPlusAttendance: (boostMsg, guild) => {
        const completeEmbed = new MessageEmbed();

        let tankNickname, healerNickname, dps1Nickname, dps2Nickname;
        if (!boostMsg.isTeamClaimed) {
            tankNickname = boostMsg.tank;
            healerNickname = boostMsg.healer;
            dps1Nickname = boostMsg.dps1;
            dps2Nickname = boostMsg.dps2;
        } else {
            const teamClaimed = boostMsg.teamClaim[boostMsg.teamName];
            tankNickname = utils.getUserMember(guild, teamClaimed[0]);
            healerNickname = utils.getUserMember(guild, teamClaimed[1]);
            dps1Nickname = utils.getUserMember(guild, teamClaimed[2]);
            dps2Nickname = utils.getUserMember(guild, teamClaimed[3]);
        }

        let advertiserIcon = '<:advertiser:846532093126508564>';
        let boosterCut = `<:gold:701099811029385226>${numeral(boostMsg.boosterPot).format('0,0')}`;
        if (!boostMsg.inTime) {
            advertiserIcon = '<:madvertiser:861924367326904370>';
            boosterCut = 'Deplete';
        }

        let description = `<:TANK:701099862426648596> ${tankNickname}
<:HEALER:701099960086691870> ${healerNickname}
<:dps:701099906961768599> ${dps1Nickname}
<:dps:701099906961768599> ${dps2Nickname}

${advertiserIcon} ${boostMsg.advertiser}`;

        if (boostMsg.isTrial) {
            description += `\n💰 ${boostMsg.collector}`;
        }

        completeEmbed.setTitle('Mythic Plus Attendance');
        completeEmbed.setDescription(`${description}`);
        completeEmbed.addField('Key Level', `<:keystone:701099765475180584> ${boostMsg.keyLvl}`, true);
        completeEmbed.addField('Dungeon', `${boostMsg.dungeon}`, true);
        completeEmbed.addField('Timed/Untimed', `${boostMsg.TimedUntimed}`, true);
        completeEmbed.addField('Armor Stack', `${boostMsg.armorStackName}`, true);
        completeEmbed.addField('Source', `${boostMsg.source}`, true);
        completeEmbed.addField('Realm Paid', `${boostMsg.payments.map(payment => payment.realm).join(',\n')}`, true);
        completeEmbed.addField('Total Pot', `<:gold:701099811029385226>${numeral(boostMsg.totalPot).format('0,0')}`, true);
        completeEmbed.addField('Booster Cut', `${boosterCut}`, true);
        if (boostMsg.note) {
            completeEmbed.addField('Note', `${boostMsg.note}`);
        }
        completeEmbed.setFooter(`Boost ID: ${boostMsg.boostMessage.id}`);
        completeEmbed.setColor(boostMsg.inTime ? '#00c940' : '#FF0000');

        return completeEmbed;
    },

    mythicPlusAttendanceNotification: async (boostMsg, user, attendanceMessage) => {
        const greetingPhrase = self.greetingPhrase()
        let state = 'Depleted';
        let color = '#FF0000';
        let isInline = true;
        let userNickname;
        let description = `${greetingPhrase} ${user}!
        
Attendance for run \`${boostMsg.boostId}\` was recently submitted by ${boostMsg.advertiser}.`;

        if (boostMsg.inTime) {
            state = 'Completed';
            color = '#00c940';
            description += `\n\nThank you for boosting with us!`;
            isInline = false;
            userNickname = await utils.getNickname(user, attendanceMessage.guild)
        }

        const embed = new MessageEmbed()
            .setTitle('Mythic Plus Attendance')
            .setDescription(`${description}`)
            .addField('State', `${state}`, isInline)
            .addField('Attendance Post', `[Summary](https://discord.com/channels/${attendanceMessage.guild.id}/${channels['attendance']}/${attendanceMessage.id})`, true)
            .setColor(color)
            .setFooter('Bloodlust Boosting', 'https://cdn.discordapp.com/attachments/769522185978511400/882434615107813397/Keys.png')
        if (boostMsg.inTime) {
            embed.addField('Gold Earned', `<:gold:701099811029385226>${numeral(boostMsg.boosterPot).format('0,0')}`, true)
            embed.addField('New Balance', `<:gold:701099811029385226>${numeral(await Sheet.getBalance(userNickname)).format('0,0')}`, true)
        }

        user.send({ embeds: [embed] })
    },
};

