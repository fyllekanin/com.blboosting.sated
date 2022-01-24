import { IEvent } from '../event.interface';
import { Client, MessageReaction, Permissions, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { EmojiReaction } from '../../constants/emoji.enum';
import { ConfigEnv } from '../../config.env';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../../internal-events/event.bus';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';

export class CollectedBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();
    private readonly eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const guild = await client.guilds.fetch(ConfigEnv.getConfig().DISCORD_GUILD);
        const channel = await guild.channels.fetch(messageReaction.message.channelId) as TextChannel;
        const permissions = channel.permissionsFor(user.id);
        if (!await this.isApplicable(channel, messageReaction, user, permissions)) {
            return;
        }

        const entity = await this.boostRepository.getBoostForChannel(messageReaction.message.channelId);
        entity.status.isCollected = true;
        await this.boostRepository.update({ channelId: entity.channelId }, entity);

        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, entity.channelId);

        LoggerService.logDungeonBoost({
            action: LogAction.COLLECTED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> collected the boost`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User, permissions: Readonly<Permissions>): Promise<boolean> {
        if (!(await this.boostRepository.isBoostChannel(channel.id)) && channel.id !== ConfigEnv.getConfig().DUNGEON_COLLECTOR_CHANNEL) {
            return false;
        }

        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_COLLECT_PERMISSION) &&
            messageReaction.emoji.name === EmojiReaction.MONEY_BAG;
    }
}