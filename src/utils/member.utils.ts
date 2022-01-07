import { GuildMember } from 'discord.js';
import { RolesConfig } from '../config/roles/roles.config';

export class MemberUtils {

    static isSeniorManagerOrAbove(member: GuildMember): boolean {
        return member.roles.cache.some(role => [RolesConfig.Director, RolesConfig.SeniorManagement, RolesConfig.Developer].indexOf(role.id) > -1);
    }

    static isManagerOrAbove(member: GuildMember): boolean {
        return this.isSeniorManagerOrAbove(member) || member.roles.cache.some(role => role.id === RolesConfig.Management);
    }
}