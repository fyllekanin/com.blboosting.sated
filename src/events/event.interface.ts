import { Message } from 'discord.js';

export interface IEventData {
    message: Message;
}

export interface IEvent {
    run(...args: any): void;

    getEventName(): string;
}