const roles = require('../JSON/server-info/roles.json');
const commands = require('../JSON/slashcommands.json');

const authorization = {
    allowHorde: {
        id: roles['Horde'],
        type: 'ROLE',
        permission: true
    },
    allowAlliance: {
        id: roles['Alliance'],
        type: 'ROLE',
        permission: true
    },
    denyPublicUsage: {
        id: roles['guild'],
        type: 'ROLE',
        permission: false
    },
    director: {
        id: roles['Director'],
        type: 'ROLE',
        permission: true
    },
    seniorManagement: {
        id: roles['Senior Management'],
        type: 'ROLE',
        permission: true
    },
    management: {
        id: roles['Management'],
        type: 'ROLE',
        permission: true
    },
    support: {
        id: roles['Support'],
        type: 'ROLE',
        permission: true
    },
    groupLeader: {
        id: roles['Group Leader'],
        type: 'ROLE',
        permission: true
    },
    collector: {
        id: roles['Collector'],
        type: 'ROLE',
        permission: true
    },
    advertiser: {
        id: roles['Advertiser'],
        type: 'ROLE',
        permission: true
    },
    trialAdvertiser: {
        id: roles['Trial Advertiser'],
        type: 'ROLE',
        permission: true
    },
    denyTrialAdvertiser: {
        id: roles['Trial Advertiser'],
        type: 'ROLE',
        permission: false
    }
}

module.exports = [
    {
        id: commands['boost'],
        permissions: [
            authorization.director,
            authorization.seniorManagement,
            authorization.management,
            authorization.advertiser,
            authorization.denyTrialAdvertiser,
            authorization.denyPublicUsage
        ]
    },
];