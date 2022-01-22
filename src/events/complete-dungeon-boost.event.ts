import { IEvent } from './event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../constants/discord-event.enum';
import { EmojiReaction } from '../constants/emoji.enum';
import { ConfigEnv } from '../config.env';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { BoostEntity } from '../persistance/entities/boost.entity';
import { LoggerService } from '../logging/logger.service';
import { LogAction } from '../logging/log.actions';

export class CompleteDungeonBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const guild = await client.guilds.fetch(ConfigEnv.getConfig().DISCORD_GUILD);
        const channel = await guild.channels.fetch(messageReaction.message.channelId) as TextChannel;
        const entity = await this.boostRepository.getBoostForChannel(channel.id);
        if (!await this.isApplicable(channel, messageReaction, user, entity)) {
            return;
        }
        /** Todo */
        try {
            await channel.delete();
        } catch (_) {
            // Empty
        }

        const isDeplete = messageReaction.emoji.name === EmojiReaction.DEPLETE_DUNGEON;
        LoggerService.logDungeonBoost({
            action: isDeplete ? LogAction.COMPLETED_DUNGEON_BOOST : LogAction.DEPLETED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> marked the boost as ${isDeplete ? 'depleted' : 'completed'}`,
            contentId: channel.id,
            sendToDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User, entity: BoostEntity): Promise<boolean> {
        if (channel.parent.id !== ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY || !entity.status.isStarted) {
            return false;
        }

        const permissions = channel.permissionsFor(user.id);
        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_MANAGE_PERMISSION) &&
            [EmojiReaction.COMPLETE_DUNGEON, EmojiReaction.DEPLETE_DUNGEON].includes(messageReaction.emoji.name as EmojiReaction);
    }
}