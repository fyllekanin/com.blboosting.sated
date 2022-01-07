import { IEvent } from '../events/event.interface';
import { Client, GuildMember, Interaction, Message, MessageComponentInteraction } from 'discord.js';
import { ApplicationRepository } from '../persistance/repositories/application.repository';
import { Action } from '../constants/action.enum';
import { ObjectId } from 'mongodb';
import { ApplicationEntity, ApplicationType } from '../persistance/entities/application.entity';
import { MythicPlusApplicationInteraction } from './interactions/mythic-plus-application.interaction';
import { MemberUtils } from '../utils/member.utils';
import { RolesConfig } from '../config/roles/roles.config';

export class InteractionCreateEvent implements IEvent {
    private readonly mythicPlusApplication = new MythicPlusApplicationInteraction();

    async run(_client: Client, interaction: Interaction): Promise<void> {
        if (interaction.type !== 'MESSAGE_COMPONENT') {
            return;
        }
        try {
            await (<Message>(<MessageComponentInteraction>interaction).message).delete();
        } catch (_e) {
            // Empty
        }
        const manager = interaction.guild.members.cache.get(interaction.user.id);
        if (!MemberUtils.isManagerOrAbove(manager)) {
            return;
        }
        const repository = new ApplicationRepository();
        const [action, objectId] = (<MessageComponentInteraction>interaction).customId.split('-');
        const entity = await repository.get(new ObjectId(objectId));
        const user = await interaction.guild.members.fetch(entity.applicantId);
        if (action === Action.DECLINE) {
            await this.onDeclineApplication(repository, entity, user, manager);
            return;
        }

        switch (true) {
            case entity.type === ApplicationType.MYTHIC_PLUS:
                await this.mythicPlusApplication.run(entity, user, interaction.guild);
                break;
            case entity.type === ApplicationType.RAID:
                await user.roles.add(RolesConfig.Raider);
                break;
            case entity.type === ApplicationType.PVP:
                await user.roles.add(RolesConfig.Pvp);
                break;

        }
        await user.send(`Hey ${user.displayName}, your ${entity.type} application was approved! Welcome to bloodlust!.`);
        entity.isAccepted = true;
        entity.isArchived = true;
        entity.managerId = manager.id;
        await repository.setFinalState(entity._id, true, manager.id);
    }

    getEventName(): string {
        return 'interactionCreate';
    }

    private async onDeclineApplication(repository: ApplicationRepository, entity: ApplicationEntity,
                                       user: GuildMember, manager: GuildMember): Promise<void> {
        if (user) {
            await user.send(`Hey ${user.displayName}, sorry but your ${entity.type} application was declined. Create a support ticket if you think this is not correct.`);
        }
        await repository.setFinalState(entity._id, false, manager.id);
    }
}