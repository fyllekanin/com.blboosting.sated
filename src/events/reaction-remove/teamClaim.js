const boostHashMap = require('../../models/maps/boosts');
const utils = require('../../common/utils/utils');

module.exports = async (client, message, channel, emoji, user) => {
    const boostData = boostHashMap.get(message.id);
    if (!boostData) return

    const teamNameOriginal = utils.getUserTeamName(message, user.id);
    if (!teamNameOriginal) {
        await utils.wrongRole(user, message, emoji);
        return boostData;
    }

    const teamName = teamNameOriginal.name.replace(/ /g, '');
    // eslint-disable-next-line no-prototype-builtins
    if (!boostData.teamClaim.hasOwnProperty(teamName)) {
        return boostData;
    }

    if (boostData.teamClaim[teamName].includes(user.id)) {
        boostData.teamClaim[teamName].splice(boostData.teamClaim[teamName].indexOf(user.id), 1);
    } else {
        return boostData;
    }
    // removing the team
    if (boostData.isTeamClaimed && boostData.teamName === teamName && boostData.teamClaim[teamName].length < 4) {
        boostData.isTeamClaimed = false;
        boostData.teamName = undefined;
        boostData.teamNameOriginal = undefined;

        // checking for a new One
        if (boostData.teamClaimQueue.length > 0) {
            const newTeamClaim = boostData.teamClaimQueue.shift();
            // removing the teamclaim "ready" from the list as there is less than 4 players
            if (!boostData.teamClaim[newTeamClaim.teamName].length < 4) {
                boostData.isTeamClaimed = true;
                boostData.teamName = newTeamClaim.teamName;
                boostData.teamNameOriginal = newTeamClaim.teamNameOriginal;
                const teamBooster = boostData.teamClaim[newTeamClaim.teamName][0];
                const teamNameOriginalRole = utils.getUserTeamName(message, teamBooster);
                boostData.teamNameOriginalRole = teamNameOriginalRole;
            }
        }
    }

    boostData.isTeamClaimed
        ? boostData.throttleEdit(message, 'team')
        : boostData.throttleEdit(message, 'normal')

    return boostData;
};