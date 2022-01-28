import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { ConfigEnv } from '../../config.env';
import { EventBus, INTERNAL_EVENT } from '../../internal-events/event.bus';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { EmojiReaction } from '../../constants/emoji.enum';

export class TeamTakeBoostEvent implements IEvent {
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const channel = await client.channels.fetch(messageReaction.message.channelId).catch(() => null) as TextChannel;
        if (!channel || !await this.isApplicable(channel, messageReaction, user)) {
            return;
        }
        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE);
        LoggerService.logDungeonBoost({
            action: LogAction.SIGNED_FOR_TEAM_TAKE,
            discordId: user.id,
            description: `<@${user.id}> signed for team take`,
            contentId: channel.id,
            printOnDiscord: false,
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

        return !user.bot &&
            messageReaction.emoji.name === EmojiReaction.TEAM;
    }
}