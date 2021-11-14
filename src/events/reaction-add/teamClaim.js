const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { MessageEmbed } = require('discord.js');

const utils = require('../../common/utils/utils');

const MAX_RUN_PER_DAY = 4;
const RESET_HOUR = 6;
const teamClaimCooldownFilePath = path.resolve(__dirname, '../../JSON/TeamsCooldown/teamclaim.json');

const boostMap = require('../../models/maps/boosts');

module.exports = async (client, message, channel, emoji, user) => {
    const boostData = boostMap.get(message.id);
    if (!boostData) return;

    const teamNameOriginalRole = utils.getUserTeamName(message, user.id);
    if (teamNameOriginalRole === undefined) {
        await utils.wrongRole(user, message, emoji);
        return boostData;
    }
    const teamNameOriginal = teamNameOriginalRole.name;
    if (!teamNameOriginal) {
        await utils.wrongRole(user, message, emoji);
        return boostData;
    }
    const teamName = teamNameOriginal.replace(/ /g, '');

    // check eligibility
    if (canTeamClaimBoost(teamName)) {
        emoji.users.remove(user);
        notifyFailedSignupTeamClaimUser(emoji.message, user);
        return boostData;
    }

    // eslint-disable-next-line no-prototype-builtins
    if (!boostData.teamClaim.hasOwnProperty(teamName)) {
        boostData.teamClaim[teamName] = [];
    }

    if (!boostData.teamClaim[teamName].includes(user.id)) {
        boostData.teamClaim[teamName].push(user.id);
    }

    if (boostData.teamClaim[teamName].length >= 4) {
        if (!boostData.isTeamClaimed) {
            boostData.isTeamClaimed = true;
            boostData.teamName = teamName;
            boostData.teamNameOriginal = teamNameOriginal;
            boostData.teamNameOriginalRole = teamNameOriginalRole;

            boostData.throttleEdit(message, 'team');
        } else if (boostData.isTeamClaimed
            // not the same team
            && boostData.teamName !== teamName
            && Array.isArray(boostData.teamClaimQueue)
            && !boostData.teamClaimQueue.some((teamData) => teamData.teamName === teamName)) {
            // adding to the queue
            boostData.teamClaimQueue.push({
                teamName,
                teamNameOriginal,
            });
        }
    }

    return boostData;
};


/**
 * Check if a team can claim a boost or not
 * @param {string} teamName
 * @return {boolean}
 */
async function canTeamClaimBoost(teamName) {
    let teamClaimCooldown = fs.readFileSync(teamClaimCooldownFilePath);
    teamClaimCooldown = JSON.parse(teamClaimCooldown);

    // eslint-disable-next-line no-prototype-builtins
    if (!teamClaimCooldown.hasOwnProperty(teamName)) return true;
    if (teamClaimCooldown[teamName] === MAX_RUN_PER_DAY) return false;
    return true;
}


/**
 * Notify that they reach the CD limit and needs to wait
 * @param {Message} message
 * @param {GuilMember} user
 */
function notifyFailedSignupTeamClaimUser(message, user) {
    const embedMessage = new MessageEmbed();
    // const embedMessage = getEmbedTemplateCustom('Team Claim', EMBED_COLOR_FAILLURE);
    embedMessage.setDescription(`Hello ${user},
            
            Your team can not boost through the \`TeamClaim\` option anymore today. 
            
            You can use this feature ${MAX_RUN_PER_DAY} times per day and the cool down resets at ${RESET_HOUR}am GMT 0.`)
        .setColor('#DD0044')
        .addField('Boost done', MAX_RUN_PER_DAY, true)
        .addField('Remaining', 0, true);
    user.send({ embeds: [embedMessage] })
        .catch(console.error);
}

/**
 * reset the cooldown
 */
const resetTeamToCooldown = () => {
    const res = fs.writeFileSync(teamClaimCooldownFilePath, JSON.stringify({}));
    if (res) console.error(res);
};

// ====================================================
// launch the reset each morning at 6 am
// eslint-disable-next-line no-inline-comments
const job = schedule.scheduleJob(`0 ${RESET_HOUR} * * *`, () => { // 6 hours GMT+2 everyday
    console.log('Reseting teamClaim cooldown');
    resetTeamToCooldown();
});
// ====================================================

