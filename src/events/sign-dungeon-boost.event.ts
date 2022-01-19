import { IEvent } from './event.interface';
import { Client, MessageReaction, User } from 'discord.js';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';
import { DiscordEvent } from '../constants/discord-event.enum';
import { EmojiReaction } from '../constants/emoji.enum';

export class SignDungeonBoostEvent implements IEvent {
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
                if (entity.signups.tanks.every(item => item.boosterId !== user.id)) {
                    entity.signups.tanks.push({
                        boosterId: user.id,
                        haveKey: await this.doHaveKey(reaction, user.id),
                        createdAt: new Date().getTime()
                    });
                }
                break;
            case EmojiReaction.HEALER:
                if (entity.signups.healers.every(item => item.boosterId !== user.id)) {
                    entity.signups.healers.push({
                        boosterId: user.id,
                        haveKey: await this.doHaveKey(reaction, user.id),
                        createdAt: new Date().getTime()
                    });
                }
                break;
            case EmojiReaction.DPS:
                if (entity.signups.dpses.every(item => item.boosterId !== user.id)) {
                    entity.signups.dpses.push({
                        boosterId: user.id,
                        haveKey: await this.doHaveKey(reaction, user.id),
                        createdAt: new Date().getTime()
                    });
                }
                break;
            case EmojiReaction.KEYSTONE:
                const completeList = [...entity.signups.tanks, ...entity.signups.dpses, ...entity.signups.healers];
                const items = completeList.filter(item => item.boosterId === user.id);
                for (const item of items) {
                    item.haveKey = true;
                }
                break;
        }

        await this.boostsRepository.update({ channelId: message.channelId }, entity);
        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, message.channelId);
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async doHaveKey(messageReaction: MessageReaction, boosterId: string): Promise<boolean> {
        const reaction = messageReaction.message.reactions.resolve('🔑');
        const users = await reaction.users.fetch();
        return users.some(item => item.id === boosterId);
    }

    private async isApplicable(messageReaction: MessageReaction, user: User): Promise<boolean> {
        return !user.bot &&
            SignDungeonBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name as EmojiReaction) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}