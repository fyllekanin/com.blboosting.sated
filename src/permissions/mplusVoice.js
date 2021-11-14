const { Permissions } = require('discord.js');
const roles = require('../JSON/server-info/roles.json');

module.exports = (boostMsg, guild) => {
    return [
        {
            id: guild.id,
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT,]
        },
        {
            id: roles['Director'],
            allow: manager
        },
        {
            id: roles['Senior Management'],
            allow: manager
        },
        {
            id: roles['Management'],
            allow: manager
        },
        {
            id: roles['Elite Key Booster'],
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: [Permissions.FLAGS.CONNECT]
        },
        {
            id: roles['High Key Booster'],
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: [Permissions.FLAGS.CONNECT]
        },
        {
            id: roles['Mid Key Booster'],
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: [Permissions.FLAGS.CONNECT]
        },
        {
            id: roles['Low Key Booster'],
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: [Permissions.FLAGS.CONNECT]
        },
        boostMsg?.collector?.id ? {
            id: boostMsg.collector.id,
            allow: boostMembers
        } : null,
        boostMsg?.advertiser?.id ? {
            id: boostMsg.advertiser.id,
            allow: boostMembers
        } : null,
        !boostMsg?.isTeamClaimed ? {
            id: boostMsg.tank.id,
            allow: boostMembers
        } : {
            id: boostMsg?.teamClaim[boostMsg.teamName]?.[0],
            allow: boostMembers
        },
        !boostMsg?.isTeamClaimed ? {
            id: boostMsg.healer.id,
            allow: boostMembers
        } : {
            id: boostMsg?.teamClaim[boostMsg.teamName]?.[1],
            allow: boostMembers
        },
        !boostMsg?.isTeamClaimed ? {
            id: boostMsg.dps1.id,
            allow: boostMembers
        } : {
            id: boostMsg?.teamClaim[boostMsg.teamName]?.[2],
            allow: boostMembers
        },
        !boostMsg?.isTeamClaimed ? {
            id: boostMsg.dps2.id,
            allow: boostMembers
        } : {
            id: boostMsg?.teamClaim[boostMsg.teamName]?.[3],
            allow: boostMembers
        },
    ].filter(item => item != null)
}

const manager = [
    Permissions.FLAGS.CONNECT,
    Permissions.FLAGS.SPEAK,
    Permissions.FLAGS.USE_VAD,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.STREAM,
    Permissions.FLAGS.MOVE_MEMBERS,
    Permissions.FLAGS.DEAFEN_MEMBERS,
    Permissions.FLAGS.MUTE_MEMBERS,
    Permissions.FLAGS.MANAGE_CHANNELS,
]

const boostMembers = [
    Permissions.FLAGS.CONNECT,
    Permissions.FLAGS.SPEAK,
    Permissions.FLAGS.USE_VAD,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.STREAM,
]