import { IEvent } from './event.interface';
import { Client, MessageReaction, User } from 'discord.js';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';

export class UnSignDungeonBoostEvent implements IEvent {
    private readonly boostsRepository = new BoostsRepository();
    private readonly eventBus: EventBus;
    private static readonly VALID_REACTIONS = ['🛡️', '🩹', '⚔', '🔑'];

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(_: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        if (!await this.isApplicable(messageReaction, user)) {
            return;
        }
        const reaction = messageReaction.partial ? await messageReaction.fetch() : messageReaction;
        const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
        const entity = await this.boostsRepository.getBoostForChannel(messageReaction.message.channelId);

        switch (reaction.emoji.name) {
            case '🛡️':
                if (entity.boosters.tank === user.id) {
                    entity.boosters.tank = null;
                }
                entity.signups.tanks = entity.signups.tanks.filter(item => item.boosterId !== user.id);
                break;
            case '🩹':
                if (entity.boosters.healer === user.id) {
                    entity.boosters.healer = null;
                }
                entity.signups.healers = entity.signups.healers.filter(item => item.boosterId !== user.id);
                break;
            case '⚔':
                if (entity.boosters.dpsOne === user.id) {
                    entity.boosters.dpsOne = null;
                }
                if (entity.boosters.dpsTwo === user.id) {
                    entity.boosters.dpsTwo = null;
                }
                entity.signups.dpses = entity.signups.dpses.filter(item => item.boosterId !== user.id);
                break;
            case '🔑':
                const completeList = [...entity.signups.tanks, ...entity.signups.dpses, ...entity.signups.healers];
                const item = completeList.find(item => item.boosterId === user.id);
                if (item) {
                    item.haveKey = false;
                }
                break;
        }

        await this.boostsRepository.update({ channelId: message.channelId }, entity);
        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, message.channelId);
    }

    getEventName(): string {
        return 'messageReactionRemove';
    }

    private async isApplicable(messageReaction: MessageReaction, user: User): Promise<boolean> {
        return !user.bot &&
            UnSignDungeonBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}