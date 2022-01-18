import { IEvent } from './event.interface';
import { CategoryChannel, Client, Message, TextChannel } from 'discord.js';
import { Validator } from 'jsonschema';
import { DungeonBoostSchema, IDungeonBoost } from '../schemas/dungeon-boost.schema';
import { MythicPlusEmbed } from '../embeds/mythic-plus.embed';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';


export class CreateDungeonBoostEvent implements IEvent {
    private static readonly STARTS_WITH = 'dungeonBoost';
    private static readonly BUILDING_REACTIONS = ['🛡️', '🩹', '⚔', '🔑', '💰', '⬇️', '👥', '❌'];

    async run(client: Client, message: Message): Promise<void> {
        if (!await this.isApplicable(client, message)) {
            console.log('Was not applicable');
            return;
        }

        const payload = this.getPayload(message);
        const validationResult = this.getValidationResult(payload);
        if (validationResult.length > 0) {
            await message.reply(validationResult.join('\n'));
            return;
        }

        const title = `Mythic Dungeon Boost - ${payload.key.runs}x-${payload.key.dungeon}-${payload.key.isTimed ? 'timed' : 'untimed'}`;
        const category = await client.channels.fetch(process.env.DUNGEON_BOOST_CATEGORY) as CategoryChannel;
        const channel = await category.createChannel(title);

        const repository = new BoostsRepository();
        await repository.insert({
            channelId: channel.id,
            contact: payload.contact,
            source: payload.source,
            payments: payload.payments,
            discount: payload.discount,
            stack: payload.stack,
            advertiserId: payload.advertiser.advertiserId,
            notes: payload.notes,
            key: payload.key,
            boosters: {},
            signups: {
                tanks: [],
                healers: [],
                dpses: []
            }
        });

        await this.createEmbed(channel, title, payload);
    }

    async isApplicable(_: Client, message: Message): Promise<boolean> {
        const startsWith = `${process.env.DEFAULT_PREFIX}${CreateDungeonBoostEvent.STARTS_WITH}`;
        return message.channelId === process.env.CREATE_DUNGEON_BOOST_CHANNEL &&
            message.content.startsWith(startsWith);
    }

    getEventName(): string {
        return 'messageCreate';
    }

    private getPayload(message: Message): IDungeonBoost {
        const content = message.content.replace(`${process.env.DEFAULT_PREFIX}${CreateDungeonBoostEvent.STARTS_WITH} `, '');
        try {
            return JSON.parse(content);
        } catch (_) {
            return null;
        }
    }

    private async createEmbed(channel: TextChannel, title: string, payload: IDungeonBoost): Promise<void> {
        const totalPot = payload.payments.reduce((prev, curr) => prev + curr.amount, 0);

        const message = await channel.send({
            embeds: [
                new MythicPlusEmbed()
                    .withTitle(title)
                    .withBoosters([])
                    .withStacks(payload.stack)
                    .withKey({ dungeon: payload.key.dungeon, level: payload.key.level })
                    .withIsTimed(payload.key.isTimed)
                    .withBoosterPot((totalPot * 0.70) / 4)
                    .withTotalPot(totalPot)
                    .withSource(payload.source)
                    .withPayments(payload.payments.map(payment => ({ realm: payment.realm, faction: payment.faction })))
                    .withAdvertiserId(payload.advertiser.advertiserId)
                    .generate()
            ]
        });
        for (const reaction of CreateDungeonBoostEvent.BUILDING_REACTIONS) {
            await message.react(reaction);
        }
    }

    private getValidationResult(payload: Object): Array<string> {
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