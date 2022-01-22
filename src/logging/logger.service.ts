import { LogAction } from './log.actions';
import { LogsRepository } from '../persistance/repositories/logs.repository';
import { Client, TextChannel } from 'discord.js';
import { LogType } from './log.types';
import { ConfigEnv } from '../config.env';
import { LogEmbed } from '../embeds/log.embed';

export class LoggerService {
    private static readonly REPOSITORY = new LogsRepository();

    static async logDungeonBoost(info: { action: LogAction, discordId: string, description: string, contentId: string, sendToDiscord?: boolean, client?: Client }): Promise<void> {
        this.REPOSITORY.insert({
            action: info.action,
            discordId: info.discordId,
            description: info.description,
            contentId: info.contentId,
            type: LogType.DUNGEON_BOOST
        });
        if (info.sendToDiscord && info.client) {
            const channel = await info.client.channels.fetch(ConfigEnv.getConfig().DISCORD_DUNGEON_LOGS) as TextChannel;
            await channel.send({
                embeds: [
                    new LogEmbed()
                        .withTitle(this.getPrettyAction(info.action))
                        .withContentId(info.contentId)
                        .withDescription(info.description)
                        .withUserId(info.discordId)
                        .withCreatedAt(new Date().getTime())
                        .generate()
                ]
            })
        }
    }

    private static getPrettyAction(action: LogAction): string {
        return action.replace(/_/g, ' ').replace(
            /(\w)(\w*)/g,
            (_, firstChar, rest) => firstChar + rest.toLowerCase());
    }
}