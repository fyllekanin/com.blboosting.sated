import { IEvent } from '../event.interface';
import { Client, MessageReaction, TextChannel, User } from 'discord.js';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { DiscordEvent } from '../../constants/discord-event.enum';
import { EmojiReaction } from '../../constants/emoji.enum';
import { DungeonBoosterUtils } from '../../utils/dungeon-booster.utils';
import { ConfigEnv } from '../../config.env';
import { LoggerService } from '../../logging/logger.service';
import { LogAction } from '../../logging/log.actions';
import { DungeonLevelConvert } from '../../constants/dungeon.enum';

export class DowngradeBoostEvent implements IEvent {
    private static readonly VALID_REACTIONS = [EmojiReaction.ARROW_DOWN];
    private readonly boostsRepository = new BoostsRepository();

    async run(client: Client, messageReaction: MessageReaction, user: User): Promise<void> {
        const entity = await this.boostsRepository.getBoostForChannel(messageReaction.message.channelId);
        const channel = await client.channels.fetch(entity?.channelId).catch(() => null) as TextChannel;

        if (!channel || !await this.isApplicable(channel, messageReaction, user)) {
            return;
        }
        const reaction = messageReaction.partial ? await messageReaction.fetch() : messageReaction;
        const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;

        const converted = typeof entity.key.level === 'string' ? DungeonLevelConvert(entity.key.dungeon, entity.key.level) : {
            level: entity.key.level,
            timed: entity.key.isTimed
        };
        entity.boostRoleId = DungeonBoosterUtils.getDowngradedBoostingRoleId(entity.boostRoleId, converted.timed, entity.faction);
        await this.boostsRepository.update({ channelId: entity.channelId }, entity);

        await channel.permissionOverwrites.create(entity.boostRoleId, {
            VIEW_CHANNEL: true
        });
        await message.edit(`<@&${entity.boostRoleId}> ${DungeonBoosterUtils.getStackRoleIds(entity.stack).map(id => `<@&${id}>`).join(' ')}`);
        LoggerService.logDungeonBoost({
            action: LogAction.DOWNGRADED_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${user.id}> downgraded the boost`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.MessageReactionAdd;
    }

    private async isApplicable(channel: TextChannel, messageReaction: MessageReaction, user: User): Promise<boolean> {
        const permissions = channel.permissionsFor(user.id);
        return !user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_MANAGE_PERMISSION) &&
            DowngradeBoostEvent.VALID_REACTIONS.includes(messageReaction.emoji.name as EmojiReaction) &&
            await this.boostsRepository.isBoostChannel(messageReaction.message.channelId);
    }
}