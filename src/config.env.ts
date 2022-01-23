import { PermissionString } from 'discord.js';

require('dotenv').config();

export interface FactionBoostingRole {
    roleId: string;
    tankRoleId: string;
    healerRoleId: string;
    dpsRoleId: string;
    maxUntimed: number,
    maxTimed: number
}

interface EnvConfig {
    BOT_TOKEN: string;
    BOT_INTENTS: string;
    BOT_CLIENT_ID: string;
    DEFAULT_PREFIX: string;
    DISCORD_GUILD: string;
    DISCORD_DUNGEON_LOGS: string;
    CREATE_DUNGEON_BOOST_CHANNEL: string;
    DUNGEON_BOOST_CATEGORY: string;
    DUNGEON_BOOST_MANAGE_PERMISSION: PermissionString;
    DUNGEON_BOOST_POT_PERCENTAGE: string;
    MONGODB_HOST: string;
    MONGODB_DATABASE: string;
    MONGODB_USERNAME: string;
    MONGODB_PASSWORD: string;
    DISCORD_ROLE_EVERYONE: string;
    DISCORD_ROLE_CLOTH: string;
    DISCORD_ROLE_LEATHER: string;
    DISCORD_ROLE_MAIL: string;
    DISCORD_ROLE_PLATE: string;

    DISCORD_ROLE_MAGE: string;
    DISCORD_ROLE_PRIEST: string;
    DISCORD_ROLE_WARLOCK: string;

    DISCORD_ROLE_DRUID: string;
    DISCORD_ROLE_MONK: string;
    DISCORD_ROLE_ROGUE: string;
    DISCORD_ROLE_DEMON_HUNTER: string;

    DISCORD_ROLE_SHAMAN: string;
    DISCORD_ROLE_HUNTER: string;

    DISCORD_ROLE_WARRIOR: string;
    DISCORD_ROLE_PALADIN: string;
    DISCORD_ROLE_DEATH_KNIGHT: string;

    BOOSTING_HORDE_ROLES: Array<FactionBoostingRole>;

    BOOSTING_ALLIANCE_ROLES: Array<FactionBoostingRole>;
}

export class ConfigEnv {
    private static config: EnvConfig;

    static load(): void {
        const config = {};
        for (const item of Object.keys(process.env)) {
            if (process.env[item].startsWith('[') || process.env[item].startsWith('{')) {
                try {
                    config[item] = JSON.parse(process.env[item]);
                } catch (_) {
                    config[item] = process.env[item];
                }
            } else {
                config[item] = process.env[item];
            }
        }
        this.config = config as EnvConfig;
    }

    static getConfig(): EnvConfig {
        return this.config;
    }
}