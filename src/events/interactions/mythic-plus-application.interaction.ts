import { ApplicationEntity } from '../../persistance/entities/application.entity';
import { Guild, GuildMember } from 'discord.js';
import { RaiderIoService } from '../../services/raider-io.service';
import { RaiderIoCharacter } from '../../interfaces/raider-io.interface';
import { RolesConfig } from '../../config/roles/roles.config';

export class MythicPlusApplicationInteraction {

    async run(entity: ApplicationEntity, user: GuildMember, guild: Guild): Promise<void> {
        const raiderId = await RaiderIoService.getCharacter(entity.character.region, entity.character.realm,
            entity.character.name);
        const applicableRoles = await this.getApplicableRoles(raiderId);
        const roles = applicableRoles.map(applicableRole => guild.roles.cache.get(applicableRole));
        await user.roles.add(roles);
    }

    private async getApplicableRoles(raiderIo: RaiderIoCharacter): Promise<Array<string>> {
        const checks = {
            elite: 2500,
            high: 2300,
            mid: 2100,
            low: 1900
        };
        const roles = [];
        const ratings = raiderIo.mythic_plus_scores_by_season[0].scores;
        for (let key in ratings) {
            if (key === 'all') {
                continue;
            }
            roles.push(ratings[key] >= checks.elite ? RolesConfig.EliteKeyBooster : null);
            roles.push(ratings[key] >= checks.high ? RolesConfig.HighKeyBooster : null);
            roles.push(ratings[key] >= checks.mid ? RolesConfig.MidKeyBooster : null);
            roles.push(ratings[key] >= checks.low ? RolesConfig.LowKeyBooster : null);
        }
        if (roles.filter(item => item != null).length === 0) {
            return [];
        }
        roles.push(ratings.tank >= checks.low ? RolesConfig.Tank : null);
        roles.push(ratings.healer >= checks.low ? RolesConfig.Healer : null);
        roles.push(ratings.dps >= checks.low ? RolesConfig.Dps : null);

        switch (raiderIo.class.toLowerCase()) {
            case 'paladin':
            case 'warrior':
            case 'death knight':
                roles.push(RolesConfig.Plate);
                break;
            case 'shaman':
            case 'hunter':
                roles.push(RolesConfig.Mail);
                break;
            case 'monk':
            case 'rogue':
            case 'druid':
            case 'demon hunter':
                roles.push(RolesConfig.Leather);
                break;
            case 'mage':
            case 'priest':
            case 'warlock':
                roles.push(RolesConfig.Cloth);
                break;
        }

        return roles.filter(item => item != null);
    }
}