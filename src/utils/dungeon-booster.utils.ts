import { ConfigEnv } from '../config.env';
import { StackKey } from '../constants/Stack.enum';

export class DungeonBoosterUtils {

    static getStackRoleIds(stacks: Array<StackKey>): Array<string> {
        return stacks
            .filter(key => process.env[`DISCORD_ROLE_${key}`])
            .map(key => process.env[`DISCORD_ROLE_${key}`]);
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
        }, null)?.id;
    }
}