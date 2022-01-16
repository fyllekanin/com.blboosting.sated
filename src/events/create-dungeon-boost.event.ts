import { IEvent } from './event.interface';
import { Client, Message } from 'discord.js';
import { Validator } from 'jsonschema';
import { DungeonBoostSchema } from '../schemas/dungeon-boost.schema';

export class CreateDungeonBoostEvent implements IEvent {
    private static readonly STARTS_WITH = 'dungeonBoost';

    async run(client: Client, message: Message): Promise<void> {
        if (!await this.isApplicable(client, message)) {
            console.log('Was not applicable');
            return;
        }

        const payload = this.getPayload(message);
        const validator = new Validator();
        const result = validator.validate(payload, DungeonBoostSchema);

        if (!result.valid) {
            const errorMessage = [`The data is having incorrect data or missing data.`];
            result.errors.forEach((err, index) => errorMessage.push(`#${index+1} ${err.property} ${err.message}`));
            await message.reply(errorMessage.join('\n'));
            return;
        }

        await message.reply('All looks good');
    }

    async isApplicable(_: Client, message: Message): Promise<boolean> {
        const startsWith = `${process.env.DEFAULT_PREFIX}${CreateDungeonBoostEvent.STARTS_WITH}`;
        return message.channelId === process.env.CREATE_DUNGEON_BOOST_CHANNEL &&
            message.content.startsWith(startsWith);
    }

    getEventName(): string {
        return 'messageCreate';
    }

    private getPayload(message: Message): Object {
        const content = message.content.replace(`${process.env.DEFAULT_PREFIX}${CreateDungeonBoostEvent.STARTS_WITH} `, '');
        try {
            return JSON.parse(content);
        } catch (_) {
            return null;
        }
    }
}