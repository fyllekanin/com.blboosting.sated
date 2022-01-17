import { IEvent } from './event.interface';
import { Client, MessageReaction, User } from 'discord.js';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';

export class SignDungeonBoostEvent implements IEvent {
    private readonly boostsRepository = new BoostsRepository();
    private static readonly VALID_REACTIONS = ['🛡️', '🩹', '⚔', '🔑'];

    async run(_: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        if (!await this.isApplicable(messageReaction, user)) {
            console.log('No applicable')
            return;
        }
        const reaction = messageReaction.partial ? await messageReaction.fetch() : messageReaction;
        const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
        // const entity = await this.boostsRepository.getBoostForChannel(messageReaction.message.channelId);

        const keyholder = await message.reactions.resolve('🔑').users.fetch();
        keyholder.forEach((keyHolder) => {
            console.log(JSON.stringify(keyHolder));
            // console.log(`${keyHolder.username} have reacted on key with index ${index} in list`);
        });
    }

    getEventName(): string {
        return 'messageReactionAdd';
    }

    private async isApplicable(messageReaction: MessageReaction, user: User): Promise<boolean> {
        return !user.bot &&
            SignDungeonBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}