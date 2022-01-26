import { DiscordEvent } from '../constants/discord-event.enum';
import { Client, Interaction, Message, MessageReaction, User } from 'discord.js';

export interface IEvent {
    run: ((client: Client, message: Message) => Promise<void>) |
        ((client: Client, interaction: Interaction) => Promise<void>) |
        ((client: Client, messageReaction: MessageReaction, user: User) => Promise<void>);
    getEventName: () => DiscordEvent;
}