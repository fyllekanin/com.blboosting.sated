import { LogAction } from './log.actions';
import { LogsRepository } from '../persistance/repositories/logs.repository';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { LogType } from './log.types';
import { ConfigEnv } from '../config.env';
import { LogEmbed } from '../embeds/log.embed';
import { LogEntity } from '../persistance/entities/log.entity';

export class LoggerService {
    private static readonly REPOSITORY = new LogsRepository();

    static async logDungeonBoost(info: { action: LogAction, discordId: string, description: string, contentId: string, printOnDiscord: boolean, client: Client }): Promise<void> {
        const logs = await this.REPOSITORY.getLogForContentId(info.contentId);
        const channel = await info.client.channels.fetch(ConfigEnv.getConfig().DISCORD_DUNGEON_LOGS) as TextChannel;
        const message = logs.length > 0 ? await channel.messages.fetch(logs[0].messageId) : await channel.send({ content: 'Generating log....' });
        const entry: LogEntity = {
            action: info.action,
            discordId: info.discordId,
            description: info.description,
            contentId: info.contentId,
            type: LogType.DUNGEON_BOOST,
            messageId: message.id,
            printOnDiscord: info.printOnDiscord,
            createdAt: new Date().getTime()
        };
        logs.push(entry);

        this.REPOSITORY.insert(entry);
        if (info.printOnDiscord && info.client) {
            const embeds: Array<MessageEmbed> = [];
            let count = 1;
            let embed = new LogEmbed()
                .withTitle(`Log entries for dungeon boost: ${info.contentId}`)
                .withContentId(info.contentId);
            for (const log of logs) {
                if (!log.printOnDiscord) {
                    continue;
                }
                if (count === 8) {
                    embeds.push(embed.generate());
                    embed = new LogEmbed()
                        .withTitle(`Log entries for dungeon boost: ${log.contentId}`)
                        .withContentId(log.contentId);
                }
                embed.addEntry({ discordId: log.discordId, description: log.description, createdAt: log.createdAt });
                count++;
            }
            if (embed.getEntryCount() > 0) {
                embeds.push(embed.generate());
            }

            message.edit({
                content: `Logs for ${info.contentId}`,
                embeds: embeds
            })
        }
    }
}