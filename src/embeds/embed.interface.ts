import { MessageEmbed } from 'discord.js';

export interface EmbedInterface {
    generate: () => MessageEmbed;
}