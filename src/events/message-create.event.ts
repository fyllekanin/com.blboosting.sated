import { IEvent } from './event.interface';
import { CommandFactory } from '../commands/command.factory';
import { CommandUtils } from '../utils/command.utils';
import { Client, Message } from 'discord.js';

export class MessageCreateEvent implements IEvent {
    run(client: Client, message: Message): void {
        const commandString = CommandFactory.getCommandWithPrefix(message);
        const command = CommandFactory.getCommand(CommandUtils.getCommandPrefix(commandString));
        if (!command || !command.isAllowed(message)) {
            return;
        }
        command.run(client, message);
    }

    getEventName(): string {
        return 'messageCreate';
    }
}