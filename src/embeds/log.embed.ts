import { EmbedInterface } from './embed.interface';
import { MessageEmbed } from 'discord.js';

export class LogEmbed implements EmbedInterface {
    private title: string;
    private userId: string;
    private description: string;
    private createdAt: number;
    private contentId: string;

    withTitle(title: string): LogEmbed {
        this.title = title;
        return this;
    }

    withUserId(userId: string): LogEmbed {
        this.userId = userId;
        return this;
    }

    withDescription(description: string): LogEmbed {
        this.description = description;
        return this;
    }

    withCreatedAt(createdAt: number): LogEmbed {
        this.createdAt = createdAt;
        return this;
    }

    withContentId(contentId: string): LogEmbed {
        this.contentId = contentId;
        return this;
    }

    generate(): MessageEmbed {
        const date = new Date(this.createdAt);
        return new MessageEmbed()
            .setTitle(this.title)
            .addFields([
                { name: 'User', value: `<@${this.userId}>`, inline: true },
                { name: 'Description', value: this.description, inline: true },
                { name: 'Timestamp', value: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, inline: true },
                { name: 'ID', value: this.contentId }
            ])
    }
}