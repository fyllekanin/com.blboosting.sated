import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { EmojiReaction } from '../../constants/emoji.enum';
import { ConfigEnv } from '../../config.env';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { DungeonBoostAttendanceEmbed } from '../../embeds/dungeon-boost-attendance.embed';

export class CompleteBoostEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const channel = await client.channels.fetch(messageReaction.message.channelId).catch(() => null) as TextChannel;
        const entity = channel ? await this.boostRepository.getBoostForChannel(channel.id) : null;
        if (!entity || !await this.isApplicable(channel, messageReaction, user, entity)) {
            return;
        }
        const isDeplete = messageReaction.emoji.name === EmojiReaction.DEPLETE_DUNGEON;
        const voiceChannel = await client.channels.fetch(entity.voiceChannelId).catch(() => null);

        try {
            entity.status.isCompleted = !isDeplete;
            entity.status.isDepleted = isDeplete;
            await channel.delete();
            await voiceChannel?.delete();
        } catch (_) {
            // Empty
        }

        const attendanceChannel = await client.channels.fetch(ConfigEnv.getConfig().DUNGEON_BOOST_ATTENDANCE) as TextChannel;
        attendanceChannel.send({
            content: `Boost ID: ${entity.channelId}`,
            embeds: [
                new DungeonBoostAttendanceEmbed()
                    .withBoostId(entity.channelId)
                    .withTankId(entity.boosters.tank)
                    .withHealerId(entity.boosters.healer)
                    .withDpsOneId(entity.boosters.dpsOne)
                    .withDpsTwoId(entity.boosters.dpsTwo)
                    .withAdvertiserId(entity.advertiserId)
                    .withLevel(entity.key.level)
                    .withRuns(entity.key.runs)
                    .withDungeon(entity.key.dungeon)
                    .withIsTimed(entity.key.isTimed)
                    .withStacks(entity.stack)
                    .withSource(entity.source)
                    .withTotalPot(entity.payments.reduce((prev, curr) => prev + curr.amount, 0))
                    .withNotes(entity.notes)
                    .generate()
            ]
        })

        LoggerService.logDungeonBoost({
            action: isDeplete ? LogAction.COMPLETED_DUNGEON_BOOST : LogAction.DEPLETED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> marked the boost as ${isDeplete ? 'depleted' : 'completed'}`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User, entity: BoostEntity): Promise<boolean> {
        if (channel.parent.id !== ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY || !entity.status.isStarted) {
            return false;
        }

        const permissions = channel.permissionsFor(user.id);
        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_MANAGE_PERMISSION) &&
            [EmojiReaction.COMPLETE_DUNGEON, EmojiReaction.DEPLETE_DUNGEON].includes(messageReaction.emoji.name as EmojiReaction);
    }
}