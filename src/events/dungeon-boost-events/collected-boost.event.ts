import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { EmojiReaction } from '../../constants/emoji.enum';
import { ConfigEnv } from '../../config.env';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../../internal-events/event.bus';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { CollectorEmbed } from '../../embeds/collector.embed';

export class CollectedBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();
    private readonly eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const channel = await client.channels.fetch(messageReaction.message.channelId).catch(() => null) as TextChannel;
        if (!channel || !await this.isApplicable(channel, messageReaction, user)) {
            return;
        }

        const isCollectorMessage = channel.id === ConfigEnv.getConfig().DUNGEON_COLLECTOR_CHANNEL;
        const entity = isCollectorMessage ?
            await this.boostRepository.getBoostForCollectorMessage(messageReaction.message.id) :
            await this.boostRepository.getBoostForChannel(messageReaction.message.channelId);

        entity.status.isCollected = true;
        entity.payments.forEach(item => item.collectorId = user.id);
        await this.boostRepository.update({ channelId: entity.channelId }, entity);

        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, entity.channelId);

        messageReaction.message.edit({
            content: `<@&${ConfigEnv.getConfig().COLLECTOR_ROLE_ID}>`,
            embeds: [
                new CollectorEmbed()
                    .withBoostId(entity.channelId)
                    .withAdvertiserId(entity.advertiserId)
                    .withPayments(entity.payments.filter(item => !item.isBalance).map(item => ({
                        realm: item.realm,
                        faction: item.faction,
                        amount: item.amount
                    })))
                    .generate()
            ]
        })

        LoggerService.logDungeonBoost({
            action: LogAction.COLLECTED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> collected the boost`,
            contentId: entity.channelId,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User): Promise<boolean> {
        if (!(await this.boostRepository.isBoostChannel(channel.id)) && channel.id !== ConfigEnv.getConfig().DUNGEON_COLLECTOR_CHANNEL) {
            return false;
        }

        const permissions = channel.permissionsFor(user.id);
        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_COLLECT_PERMISSION) &&
            messageReaction.emoji.name === EmojiReaction.MONEY_BAG;
    }
}