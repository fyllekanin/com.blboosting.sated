import { Client, Message } from 'discord.js';

export interface ICommand {
    run: Function;

    getCommand(): string;

    isAllowed(message: Message): boolean;
}