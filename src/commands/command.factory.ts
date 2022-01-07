import { ICommand } from './command.interface';
import { Message } from 'discord.js';
import { ChannelsConfig } from '../config/channels/channels.config';

export function getCommands(): Map<string, ICommand> {
    return [
        // Here
    ].reduce((prev: Map<string, ICommand>, curr: ICommand) => {
        prev.set(curr.getCommand(), curr);
        return prev;
    }, new Map<string, ICommand>());
}


