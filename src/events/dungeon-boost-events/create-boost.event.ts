import { IEvent } from '../event.interface';
import { CategoryChannel, Client, Message, TextChannel } from 'discord.js';
import { Validator } from 'jsonschema';
import { DungeonBoostSchema, IDungeonBoost } from '../../schemas/dungeon-boost.schema';
import { MythicPlusEmbed } from '../../embeds/mythic-plus.embed';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../../internal-events/event.bus';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { BoosterRole } from '../../constants/role.constant';
import { EmojiReaction } from '../../constants/emoji.enum';
import { ConfigEnv } from '../../config.env';
import { DungeonBoosterUtils } from '../../utils/dungeon-booster.utils';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { DungeonLevelConvert } from '../../constants/dungeon.enum';
import { CollectorEmbed } from '../../embeds/collector.embed';


export class CreateBoostEvent implements IEvent {
    private static readonly STARTS_WITH = 'dungeonBoost';
    private static readonly BUILDING_REACTIONS = [
        EmojiReaction.TANK,
        EmojiReaction.HEALER,
        EmojiReaction.DPS,
        EmojiReaction.KEYSTONE,
        EmojiReaction.MONEY_BAG,
        EmojiReaction.ARROW_DOWN,
        EmojiReaction.TEAM,
        EmojiReaction.CANCEL
    ];
    private readonly eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, message: Message): Promise<void> {
        if (!await this.isApplicable(message)) {
            return;
        }

        const payload = this.getPayload(message);
        const validationResult = this.getValidationResult(payload);
        if (validationResult.length > 0) {
            await message.reply(validationResult.join('\n'));
            return;
        }

        const title = `Mythic Dungeon Boost - ${payload.key.runs}x-${payload.key.dungeon}-${payload.key.isTimed ? 'timed' : 'untimed'}`;
        const category = await client.channels.fetch(ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY) as CategoryChannel;

        const converted = typeof payload.key.level === 'string' ? DungeonLevelConvert(payload.key.dungeon, payload.key.level) : {
            level: payload.key.level,
            timed: payload.key.isTimed
        };
        const boostingRoleId = DungeonBoosterUtils.getAllowedBoostingRoleId(converted.level, converted.timed, payload.faction);
        const channel = await category.createChannel(title);
        await channel.lockPermissions();
        await channel.permissionOverwrites.create(boostingRoleId, {
            VIEW_CHANNEL: true
        });


        const repository = new BoostsRepository();
        const entity = await repository.insert({
            faction: payload.faction,
            channelId: channel.id,
            messageId: null,
            collectorMessageId: null,
            voiceChannelId: null,
            boostRoleId: boostingRoleId,
            contact: payload.contact,
            source: payload.source,
            payments: payload.payments,
            discount: payload.discount,
            stack: payload.stack,
            advertiserId: payload.advertiserId,
            notes: payload.notes,
            key: payload.key,
            boosters: {
                tank: payload.boosters.find(item => item.role === BoosterRole.TANK.value)?.boosterId,
                healer: payload.boosters.find(item => item.role === BoosterRole.HEALER.value)?.boosterId,
                dpsOne: payload.boosters.filter(item => item.role === BoosterRole.DPS.value)[0]?.boosterId,
                dpsTwo: payload.boosters.filter(item => item.role === BoosterRole.DPS.value)[1]?.boosterId,
                keyholder: payload.boosters.find(item => item.isKeyHolder)?.boosterId
            },
            status: {
                isStarted: false,
                isCollected: false,
                isCompleted: false,
                isDepleted: false
            },
            signups: {
                tanks: [],
                healers: [],
                dpses: []
            }
        });

        const embedMessage = await this.createEmbed(channel, title, payload, boostingRoleId);
        entity.messageId = embedMessage.id;
        await repository.update({ channelId: channel.id }, entity);
        this.reactToMessage(embedMessage);

        const permissions = channel.permissionsFor(message.author.id);
        if (permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_COLLECT_PERMISSION)) {
            const collectorChannel = await client.channels.fetch(ConfigEnv.getConfig().DUNGEON_COLLECTOR_CHANNEL) as TextChannel;
            const collectorMessage = await collectorChannel.send({
                content: `<@&${ConfigEnv.getConfig().COLLECTOR_ROLE_ID}>`,
                embeds: [
                    new CollectorEmbed()
                        .withBoostId(channel.id)
                        .withAdvertiserId(payload.advertiserId)
                        .withPayments(payload.payments.filter(item => !item.isBalance).map(item => ({
                            realm: item.realm,
                            faction: item.faction,
                            amount: item.amount
                        })))
                        .generate()
                ]
            });
            await collectorMessage.react(EmojiReaction.MONEY_BAG);
            await collectorMessage.react(EmojiReaction.WAVING_HAND);
            entity.collectorMessageId = collectorMessage.id;
            await repository.update({ channelId: channel.id }, entity);
        }

        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, entity.channelId);
        LoggerService.logDungeonBoost({
            action: LogAction.CREATED_DUNGEON_BOOST,
            discordId: message.author.id,
            description: `<@${message.author.id}> created a new boost`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageCreate;
    }

    private async reactToMessage(message: Message): Promise<void> {
        for (const reaction of CreateBoostEvent.BUILDING_REACTIONS) {
            await message.react(reaction);
        }
    }

    private async isApplicable(message: Message): Promise<boolean> {
        const startsWith = `${ConfigEnv.getConfig().DEFAULT_PREFIX}${CreateBoostEvent.STARTS_WITH}`;
        return message.channelId === ConfigEnv.getConfig().CREATE_DUNGEON_BOOST_CHANNEL &&
            message.content.startsWith(startsWith);
    }

    private getPayload(message: Message): IDungeonBoost {
        const content = message.content.replace(`${ConfigEnv.getConfig().DEFAULT_PREFIX}${CreateBoostEvent.STARTS_WITH} `, '');
        try {
            return JSON.parse(content);
        } catch (_) {
            return null;
        }
    }

    private async createEmbed(channel: TextChannel, title: string, payload: IDungeonBoost, boostingRoleId: string): Promise<Message> {
        const totalPot = payload.payments.reduce((prev, curr) => prev + curr.amount, 0);

        return await channel.send({
            content: `<@&${boostingRoleId}> ${DungeonBoosterUtils.getStackRoleIds(payload.stack).map(id => `<@&${id}>`).join(' ')}`,
            embeds: [
                new MythicPlusEmbed()
                    .withTitle(title)
                    .withBoosters([])
                    .withStacks(payload.stack)
                    .withKey({ dungeon: payload.key.dungeon, level: payload.key.level })
                    .withIsTimed(payload.key.isTimed)
                    .withBoosterPot(DungeonBoosterUtils.getBoosterPot(totalPot))
                    .withTotalPot(totalPot)
                    .withSource(payload.source)
                    .withPayments(payload.payments.map(payment => ({ realm: payment.realm, faction: payment.faction })))
                    .withAdvertiserId(payload.advertiserId)
                    .withNotes(payload.notes)
                    .generate()
            ]
        });
    }

    private getValidationResult(payload: IDungeonBoost): Array<string> {
        const validator = new Validator();
        const result = validator.validate(payload, DungeonBoostSchema);
        const errorMessage: Array<string> = [];
        if (!result.valid) {
            errorMessage.push(`The data is having incorrect data or missing data.`);
            result.errors.forEach((err, index) => errorMessage.push(`#${index + 1} ${err.property} ${err.message}`));
        }
        return errorMessage;
    }
}