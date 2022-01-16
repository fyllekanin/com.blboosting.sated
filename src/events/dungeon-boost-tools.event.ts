import { IEvent } from './event.interface';
import {
    Client,
    Message,
    MessageActionRow,
    MessageButton,
    TextChannel
} from 'discord.js';


export class DungeonBoostToolsEvent implements IEvent {
    private static readonly STARTS_WITH = 'tools';

    async run(_: Client, message: Message): Promise<void> {
        if (!this.isApplicable(message)) {
            return;
        }

        await message.delete();
        await message.channel.send({
            content: `Tools for you <@${message.author.id}>`,
            components: [
                new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setCustomId('COLLECT')
                            .setLabel('💰 Collected')
                            .setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('DOWNGRADE')
                            .setLabel('⬇️Downgrade requirement')
                            .setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('CANCEL')
                            .setLabel('❌ Cancel boost')
                            .setStyle('SECONDARY')
                    ])
            ]
        })
    }

    private isApplicable(message: Message): boolean {
        return message.content === `${process.env.DEFAULT_PREFIX}${DungeonBoostToolsEvent.STARTS_WITH}` &&
            (<TextChannel>message.channel).parent.id === process.env.DUNGEON_BOOST_CATEGORY;
    }

    getEventName(): string {
        return 'messageCreate';
    }
}