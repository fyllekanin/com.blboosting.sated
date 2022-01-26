import { ConfigEnv, EnvConfig } from '../config.env';

global.beforeEach(async () => {
    ConfigEnv.getConfig = function () {
        return <EnvConfig><unknown>{
            DUNGEON_BOOST_POT_PERCENTAGE: '70',

            DISCORD_ROLE_EVERYONE: '1',
            DISCORD_ROLE_CLOTH: '2',
            DISCORD_ROLE_LEATHER: '3',
            DISCORD_ROLE_MAIL: '4',
            DISCORD_ROLE_PLATE: '5',

            DISCORD_ROLE_MAGE: '6',
            DISCORD_ROLE_PRIEST: '7',
            DISCORD_ROLE_WARLOCK: '8',

            DISCORD_ROLE_DRUID: '9',
            DISCORD_ROLE_MONK: '10',
            DISCORD_ROLE_ROGUE: '11',
            DISCORD_ROLE_DEMON_HUNTER: '12',

            DISCORD_ROLE_SHAMAN: '13',
            DISCORD_ROLE_HUNTER: '14',

            DISCORD_ROLE_WARRIOR: '15',
            DISCORD_ROLE_PALADIN: '16',
            DISCORD_ROLE_DEATH_KNIGHT: '17',

            BOOSTING_HORDE_ROLES: [{
                'roleId': '1',
                'maxUntimed': 9,
                'maxTimed': 9
            }],

            BOOSTING_ALLIANCE_ROLES: [{
                'roleId': '2',
                'maxUntimed': 9,
                'maxTimed': 9
            }]
        };
    };
});

it('setup', () => {
    expect(true).toBeTruthy();
});
