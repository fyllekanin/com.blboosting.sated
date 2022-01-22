import { InternalEventInterface } from '../internal-event.interface';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { CategoryChannel, Client, Message, TextChannel } from 'discord.js';
import { ConfigEnv } from '../../config.env';
import { EmojiReaction } from '../../constants/emoji.enum';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { EventBus, INTERNAL_EVENT } from '../event.bus';

export class StartDungeonBoostEvent implements InternalEventInterface {
    private static readonly EMOJIS_TO_CLEAN = [EmojiReaction.TANK, EmojiReaction.HEALER, EmojiReaction.DPS, EmojiReaction.KEYSTONE];
    private readonly boostsRepository = new BoostsRepository();
    private readonly client: Client;
    private readonly eventBus: EventBus;
    private throttleTimeout: any;

    constructor(client: Client, eventBus: EventBus) {
        this.client = client;
        this.eventBus = eventBus;
    }

    async run(): Promise<void> {
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout);
        }
        this.throttleTimeout = setTimeout(async () => {
            const category = await this.client.channels.fetch(ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY) as CategoryChannel;
            const channels = category.children.map(child => child as TextChannel);
            const entities = await this.boostsRepository.getBoostsForChannels(channels.map(channel => channel.id));

            for (const entity of entities) {
                const channel = await this.client.channels.fetch(entity.channelId) as TextChannel;
                const message = await channel.messages.fetch(entity.messageId);
                if (message.reactions.resolve(EmojiReaction.COMPLETE_DUNGEON) == null && this.isBoostReadyToStart(entity)) {
                    await this.updateBoost(entity, message, channel, entities);
                }

                await this.boostsRepository.update({ channelId: entity.channelId }, entity);
            }
            this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE);
        }, 200);
    }

    private async updateBoost(entity: BoostEntity, message: Message, entityChannel: TextChannel, entities: Array<BoostEntity>): Promise<void> {
        await message.reactions.removeAll();
        await message.react(EmojiReaction.COMPLETE_DUNGEON);
        await message.react(EmojiReaction.DEPLETE_DUNGEON);
        entity.status.isStarted = true;
        entityChannel.send(`Boost started!
        ${EmojiReaction.TANK} <@${entity.boosters.tank}>
        ${EmojiReaction.HEALER} <@${entity.boosters.healer}>
        ${EmojiReaction.DPS} <@${entity.boosters.dpsOne}>
        ${EmojiReaction.TANK} <@${entity.boosters.dpsTwo}>
        `);
        const boosters = [entity.boosters.tank, entity.boosters.healer, entity.boosters.dpsOne, entity.boosters.dpsTwo];

        for (const item of entities) {
            if (item.channelId === entity.channelId || !this.isSignedInBoost(item, boosters)) {
                continue;
            }
            const channel = await this.client.channels.fetch(item.channelId) as TextChannel;
            const message = await channel.messages.fetch(item.messageId);
            for (const emoji of StartDungeonBoostEvent.EMOJIS_TO_CLEAN) {
                const reaction = message.reactions.resolve(emoji);
                for (const booster of boosters) {
                    await reaction.users.remove(booster);
                }
            }

            item.signups.tanks = item.signups.tanks.filter(item => !boosters.includes(item.boosterId));
            item.signups.healers = item.signups.tanks.filter(item => !boosters.includes(item.boosterId));
            item.signups.dpses = item.signups.tanks.filter(item => !boosters.includes(item.boosterId));
            item.boosters.tank = boosters.includes(item.boosters.tank) ? null : item.boosters.tank;
            item.boosters.healer = boosters.includes(item.boosters.healer) ? null : item.boosters.healer;
            item.boosters.dpsOne = boosters.includes(item.boosters.dpsOne) ? null : item.boosters.dpsOne;
            item.boosters.dpsTwo = boosters.includes(item.boosters.dpsTwo) ? null : item.boosters.dpsTwo;
            item.boosters.keyholder = boosters.includes(item.boosters.keyholder) ? null : item.boosters.keyholder;
            await this.boostsRepository.update({ channelId: item.channelId }, item);
            this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE);
        }
    }

    private isSignedInBoost(entity: BoostEntity, boosters: Array<string>) {
        return [...entity.signups.tanks, ...entity.signups.healers, ...entity.signups.dpses]
            .some(item => boosters.includes(item.boosterId));
    }

    private isBoostReadyToStart(entity: BoostEntity): boolean {
        return entity.boosters.tank &&
            entity.boosters.healer &&
            entity.boosters.dpsOne &&
            entity.boosters.dpsTwo &&
            entity.status.isCollected;
    }
}