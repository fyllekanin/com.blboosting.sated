import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { ConfigEnv } from '../../config.env';
import { EventBus, INTERNAL_EVENT } from '../../internal-events/event.bus';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { EmojiReaction } from '../../constants/emoji.enum';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';

export class TeamTakeBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const channel = await client.channels.fetch(messageReaction.message.channelId).catch(() => null) as TextChannel;
        const entity = await this.boostRepository.getBoostForChannel(channel?.id);
        if (!entity || !await this.isApplicable(channel, messageReaction, user)) {
            return;
        }
        const guildUser = await messageReaction.message.guild.members.fetch(user.id);
        const team = guildUser.roles.cache.find(item => item.name.startsWith('Team '));
        if (!team) {
            messageReaction.remove();
            return;
        }

        const completeList = [...entity.signups.tanks, ...entity.signups.dpses, ...entity.signups.healers];
        const items = completeList.filter(item => item.boosterId === user.id);
        for (const item of items) {
            item.teamId = team.id;
        }
        await this.boostRepository.update({ channelId: entity.channelId }, entity);

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