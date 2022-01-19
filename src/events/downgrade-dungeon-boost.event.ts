import { IEvent } from './event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { DiscordEvent } from '../constants/discord-event.enum';
import { EmojiReaction } from '../constants/emoji.enum';
import { DungeonBoosterUtils } from '../utils/dungeon-booster.utils';

export class DowngradeDungeonBoostEvent implements IEvent {
    private static readonly VALID_REACTIONS = [EmojiReaction.ARROW_DOWN];
    private readonly boostsRepository = new BoostsRepository();

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        if (!await this.isApplicable(messageReaction, user)) {
            return;
        }
        const reaction = messageReaction.partial ? await messageReaction.fetch() : messageReaction;
        const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
        const entity = await this.boostsRepository.getBoostForChannel(messageReaction.message.channelId);
        const channel = await client.channels.fetch(entity.channelId) as TextChannel;

        entity.boostRoleId = DungeonBoosterUtils.getDowngradedBoostingRoleId(entity.boostRoleId, entity.key.isTimed);
        await this.boostsRepository.update({ channelId: entity.channelId }, entity);

        await channel.edit({
            permissionOverwrites: [
                {
                    allow: ['VIEW_CHANNEL', 'ADD_REACTIONS'],
                    id: entity.boostRoleId,
                    type: 'role'
                }
            ]
        })
        await message.edit(`<@&${entity.boostRoleId}> ${DungeonBoosterUtils.getStackRoleIds(entity.stack).map(id => `<@&${id}>`).join(' ')}`);
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(messageReaction: MessageReaction, user: User): Promise<boolean> {
        return !user.bot &&
            DowngradeDungeonBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name as EmojiReaction) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}