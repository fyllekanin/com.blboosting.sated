import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { EmojiReaction } from '../../constants/emoji.enum';
import { ConfigEnv } from '../../config.env';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';

export class CancelBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const channel = await client.channels.fetch(messageReaction.message.channelId).catch(() => null) as TextChannel;
        if (!channel || !await this.isApplicable(channel, messageReaction, user)) {
            return;
        }
        try {
            await this.boostRepository.deleteBoostWithChannel(channel.id);
            await channel.delete();
        } catch (_) {
            // Empty
        }

        LoggerService.logDungeonBoost({
            action: LogAction.CANCELLED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> cancelled the boost`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User): Promise<boolean> {
        if (channel.parent.id !== ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY) {
            return false;
        }

        const permissions = channel.permissionsFor(user.id);
        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_MANAGE_PERMISSION) &&
            messageReaction.emoji.name === EmojiReaction.CANCEL;
    }
}