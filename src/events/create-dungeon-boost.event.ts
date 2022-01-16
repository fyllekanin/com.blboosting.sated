import { IEvent } from './event.interface';
import { CategoryChannel, Client, Message, MessageEmbed } from 'discord.js';
import { Validator } from 'jsonschema';
import { DungeonBoostSchema, IDungeonBoost } from '../schemas/dungeon-boost.schema';


export class CreateDungeonBoostEvent implements IEvent {
    private static readonly STARTS_WITH = 'dungeonBoost';

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

        await this.createChannelAndEmbed(client, payload);
    }

    private async createChannelAndEmbed(client: Client, payload: IDungeonBoost): Promise<void> {
        const title = this.getChannelTitle(payload);
        const category = await client.channels.fetch(process.env.DUNGEON_BOOST_CATEGORY) as CategoryChannel;
        const channel = await category.createChannel(title);

        const boosters = [
            '\n',
            `🛡️ <@166322953850454016>`,
            `🩹 <@166322953850454016>`,
            `⚔️<@166322953850454016>`,
            `⚔️<@166322953850454016>`
        ].join('\n')
        const message = await channel.send({
            embeds: [
                new MessageEmbed()
                    .setTitle(title)
                    .addFields([
                        { name: 'Boosters', value: boosters, inline: true },
                        { name: 'Armor Stack', value: payload.stack.join(', '), inline: true },
                        { name: 'Key', value: `${payload.key.dungeon} +${payload.key.level}`, inline: true },
                        { name: 'Timed', value: payload.key.timed ? 'Yes' : 'No', inline: true }
                    ])
                    .setFooter({
                        text: 'Type !tools to bring out additional tools for advertisers'
                    })
            ]
        });
        await message.react('🛡️');
        await message.react('🩹');
        await message.react('⚔️');
        await message.react('🔑');
        await message.react('💰');
        await message.react('⬇️');
        await message.react('👥');
        await message.react('❌');
    }

    private getChannelTitle(payload: IDungeonBoost): string {
        return `Mythic Dungeon Boost - ${payload.key.runs}x-${payload.key.dungeon}-${payload.key.timed ? 'timed' : 'untimed'}`;
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
}