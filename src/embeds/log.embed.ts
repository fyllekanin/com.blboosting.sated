import { EmbedInterface } from './embed.interface';
import { EmbedFieldData, MessageEmbed } from 'discord.js';

export class LogEmbed implements EmbedInterface {
    private title: string;
    private contentId: string;
    private entries: Array<{ discordId: string, description: string, createdAt: number }> = [];

    withTitle(title: string): LogEmbed {
        this.title = title;
        return this;
    }

    addEntry(entry: { discordId: string, description: string, createdAt: number }): LogEmbed {
        this.entries.push(entry);
        return this;
    }

    getEntryCount(): number {
        return this.entries.length;
    }

    withContentId(contentId: string): LogEmbed {
        this.contentId = contentId;
        return this;
    }

    generate(): MessageEmbed {
        const fields: Array<EmbedFieldData> = [];
        let isFirstEntry = true;
        for (const entry of this.entries) {
            const date = new Date(entry.createdAt);
            fields.push({ name: isFirstEntry ? 'User' : '\u200b', value: `<@${entry.discordId}>`, inline: true });
            fields.push({ name: isFirstEntry ? 'Description' : '\u200b', value: `${entry.description}`, inline: true });
            fields.push({
                name: isFirstEntry ? 'Timestamp' : '\u200b',
                value: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
                inline: true
            });
            isFirstEntry = false;
        }
        fields.push({ name: 'ID', value: this.contentId });
        return new MessageEmbed()
            .setTitle(this.title)
            .addFields(fields)
    }
}