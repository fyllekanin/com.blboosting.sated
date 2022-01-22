import { IEvent } from './event.interface';
import { Client, CommandInteraction, Interaction, TextChannel } from 'discord.js';
import { DiscordEvent } from '../constants/discord-event.enum';
import { ConfigEnv } from '../config.env';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { COMMAND_NAMES } from '../commands/command.interface';
import { EmojiReaction } from '../constants/emoji.enum';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';
import { LoggerService } from '../logging/logger.service';
import { LogAction } from '../logging/log.actions';

export class RemoveDungeonBoosterEvent implements IEvent {
    private static readonly EMOJIS_TO_CLEAN = [EmojiReaction.TANK, EmojiReaction.HEALER, EmojiReaction.DPS, EmojiReaction.KEYSTONE];
    private readonly boostRepository = new BoostsRepository();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, interaction: Interaction): Promise<void> {
        const channel = await client.channels.fetch(interaction.channelId) as TextChannel;
        if (!await this.isApplicable(channel, interaction)) {
            return;
        }
        const command = interaction as CommandInteraction;
        const entity = await this.boostRepository.getBoostForChannel(channel.id);
        const message = await channel.messages.fetch(entity.messageId);
        if (entity.status.isStarted || entity.status.isCompleted || entity.status.isDepleted) {
            await command.reply({
                ephemeral: true,
                content: `Boost have already started or completed!
If completed you can't do anything, but if not completed:
You can replace a booster if it's started, but if you only wanna remove you need to stop it with /${COMMAND_NAMES.STOP_DUNGEON_BOOSTER}`
            });
            return;
        }
        const user = command.options.getUser('user');

        entity.boosters.tank = entity.boosters.tank === user.id ? null : entity.boosters.tank;
        entity.boosters.healer = entity.boosters.healer === user.id ? null : entity.boosters.healer;
        entity.boosters.dpsOne = entity.boosters.dpsOne === user.id ? null : entity.boosters.dpsOne;
        entity.boosters.dpsTwo = entity.boosters.dpsTwo === user.id ? null : entity.boosters.dpsTwo;
        entity.boosters.keyholder = entity.boosters.keyholder === user.id ? null : entity.boosters.keyholder;
        entity.signups.tanks = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        entity.signups.healers = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        entity.signups.dpses = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        await this.boostRepository.update({ channelId: channel.id }, entity);
        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE);

        for (const emoji of RemoveDungeonBoosterEvent.EMOJIS_TO_CLEAN) {
            const reaction = message.reactions.resolve(emoji);
            reaction.users.remove(user.id);
        }
        await command.reply({
            ephemeral: true,
            content: `Booster removed
Booster <@${user.id}> is now removed!`
        });
        LoggerService.logDungeonBoost({
            action: LogAction.REMOVED_USER_FROM_DUNGEON_BOOST,
            discordId: user.id,
            description: `<@${interaction.user.id}> removed <@${user.id}> from the boost`,
            contentId: channel.id,
            printOnDiscord: true,
            client: client
        });
    }

    getEventName(): DiscordEvent {
        return DiscordEvent.InteractionCreate;
    }

    private async isApplicable(channel: TextChannel, interaction: Interaction): Promise<boolean> {
        if (channel.parent.id !== ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY || !interaction.isCommand()) {
            return false;
        }

        const permissions = channel.permissionsFor(interaction.user.id);
        return !interaction.user.bot &&
            permissions.has(ConfigEnv.getConfig().DUNGEON_BOOST_MANAGE_PERMISSION) &&
            interaction.commandName === COMMAND_NAMES.REMOVE_DUNGEON_BOOSTER;
    }
}