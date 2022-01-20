import { ConfigEnv } from '../config.env';
import { StackKey } from '../constants/Stack.enum';
import { BoosterRole, RoleKey } from '../constants/role.constant';
import { Guild } from 'discord.js';
import { EmojiReaction } from '../constants/emoji.enum';

export class DungeonBoosterUtils {

    static getRoleFromEmoji(emoji: EmojiReaction): RoleKey {
        switch (emoji) {
            case EmojiReaction.TANK:
                return BoosterRole.TANK.value;
            case EmojiReaction.HEALER:
                return BoosterRole.HEALER.value;
            case EmojiReaction.DPS:
                return BoosterRole.DPS.value;
        }
        return null;
    }

    static async isAllowedToSignWithStack(guild: Guild, stackRoleIds: Array<string>, userId: string, role: RoleKey): Promise<boolean> {
        if (stackRoleIds.length === 0) {
            return true;
        }

        const isAnyTankStack = this.getTankRoleIds().some(roleId => stackRoleIds.includes(roleId));
        const isAnyHealerStack = this.getHealerRoleIds().some(roleId => stackRoleIds.includes(roleId));
        if ((!isAnyTankStack && role === BoosterRole.TANK.value) || (!isAnyHealerStack && role === BoosterRole.HEALER.value)) {
            return true;
        }
        for (const stackRoleId of stackRoleIds) {
            const role = await guild.roles.fetch(stackRoleId);
            if (role.members.some(member => member.id === userId)) {
                return true;
            }
        }
        return false;
    }

    static getStackRoleIds(stacks: Array<StackKey>): Array<string> {
        return stacks
            .filter(key => process.env[`DISCORD_ROLE_${key}`])
            .map(key => process.env[`DISCORD_ROLE_${key}`]);
    }

    static getDowngradedBoostingRoleId(currentId: string, isTimed: boolean): string {
        const current = ConfigEnv.getConfig().BOOSTING_ROLES.find(item => item.roleId === currentId);
        return ConfigEnv.getConfig().BOOSTING_ROLES
            .filter(item => isTimed ? (item.maxTimed < current.maxTimed) : (item.maxUntimed < current.maxUntimed)).reduce((prev, curr) => {
                if (!prev) {
                    return curr;
                }
                const prevValue = isTimed ? prev.maxTimed : prev.maxUntimed;
                const currValue = isTimed ? curr.maxTimed : curr.maxUntimed;

                return prevValue >= currValue ? prev : curr;
            }, null)?.roleId;
    }

    static getAllowedBoostingRoleId(level: number | string, isTimed: boolean): string {
        return ConfigEnv.getConfig().BOOSTING_ROLES.reduce((prev, curr) => {
            if (!prev) {
                return curr;
            }
            const maxAllowed = isTimed ? curr.maxTimed : curr.maxUntimed;
            const prevMaxAllowed = isTimed ? prev.maxTimed : prev.maxUntimed;
            const isPrevAllowed = prevMaxAllowed >= level;
            const isAllowed = maxAllowed >= level;

            return isAllowed && (maxAllowed < prevMaxAllowed || !isPrevAllowed) ? curr : prev;
        }, null)?.roleId;
    }

    static getTankRoleIds(): Array<string> {
        return [
            ConfigEnv.getConfig().DISCORD_ROLE_LEATHER,
            ConfigEnv.getConfig().DISCORD_ROLE_PLATE,
            ConfigEnv.getConfig().DISCORD_ROLE_DRUID,
            ConfigEnv.getConfig().DISCORD_ROLE_MONK,
            ConfigEnv.getConfig().DISCORD_ROLE_DEMON_HUNTER,
            ConfigEnv.getConfig().DISCORD_ROLE_WARRIOR,
            ConfigEnv.getConfig().DISCORD_ROLE_PALADIN,
            ConfigEnv.getConfig().DISCORD_ROLE_DEATH_KNIGHT
        ];
    }

    static getHealerRoleIds(): Array<string> {
        return [
            ConfigEnv.getConfig().DISCORD_ROLE_CLOTH,
            ConfigEnv.getConfig().DISCORD_ROLE_LEATHER,
            ConfigEnv.getConfig().DISCORD_ROLE_MAIL,
            ConfigEnv.getConfig().DISCORD_ROLE_PLATE,
            ConfigEnv.getConfig().DISCORD_ROLE_PRIEST,
            ConfigEnv.getConfig().DISCORD_ROLE_DRUID,
            ConfigEnv.getConfig().DISCORD_ROLE_MONK,
            ConfigEnv.getConfig().DISCORD_ROLE_SHAMAN,
            ConfigEnv.getConfig().DISCORD_ROLE_PALADIN
        ];
    }
}