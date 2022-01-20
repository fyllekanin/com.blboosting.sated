import { IEvent } from './event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../constants/discord-event.enum';
import { EmojiReaction } from '../constants/emoji.enum';
import { ConfigEnv } from '../config.env';

export class CancelDungeonBoostEvent implements IEvent {

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const guild = await client.guilds.fetch(ConfigEnv.getConfig().DISCORD_GUILD);
        const channel = await guild.channels.fetch(messageReaction.message.channelId) as TextChannel;
        if (!await this.isApplicable(channel, messageReaction, user)) {
            return;
        }
        try {
            await channel.delete();
        } catch (_) {
            // Empty
        }
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
            permissions.has('SEND_MESSAGES') &&
            messageReaction.emoji.name === EmojiReaction.CANCEL;
    }
}