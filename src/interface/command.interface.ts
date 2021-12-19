import { Client, Message } from 'discord.js';
export interface ICommand {
  name: string;
  description?: string;
  aliases?: string[];
  run(data: CommandProps): Promise<any>;
}

export interface CommandProps {
  client?: Client;
  message: Message;
  args?: string[];
}
