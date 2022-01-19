import { IEvent } from './event.interface';
import { Client, MessageReaction, User } from 'discord.js';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';
import { DiscordEvent } from '../constants/discord-event.enum';
import { EmojiReaction } from '../constants/emoji.enum';

export class UnSignDungeonBoostEvent implements IEvent {
    private static readonly VALID_REACTIONS = [EmojiReaction.TANK, EmojiReaction.HEALER, EmojiReaction.DPS, EmojiReaction.KEYSTONE];
    private readonly boostsRepository = new BoostsRepository();
    private readonly eventBus: EventBus;

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
            case EmojiReaction.TANK:
                if (entity.boosters.tank === user.id) {
                    entity.boosters.tank = null;
                }
                entity.signups.tanks = entity.signups.tanks.filter(item => item.boosterId !== user.id);
                break;
            case EmojiReaction.HEALER:
                if (entity.boosters.healer === user.id) {
                    entity.boosters.healer = null;
                }
                entity.signups.healers = entity.signups.healers.filter(item => item.boosterId !== user.id);
                break;
            case EmojiReaction.DPS:
                if (entity.boosters.dpsOne === user.id) {
                    entity.boosters.dpsOne = null;
                }
                if (entity.boosters.dpsTwo === user.id) {
                    entity.boosters.dpsTwo = null;
                }
                entity.signups.dpses = entity.signups.dpses.filter(item => item.boosterId !== user.id);
                break;
            case EmojiReaction.KEYSTONE:
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

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionRemove;
    }

    private async isApplicable(messageReaction: MessageReaction, user: User): Promise<boolean> {
        return !user.bot &&
            UnSignDungeonBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name as EmojiReaction) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}