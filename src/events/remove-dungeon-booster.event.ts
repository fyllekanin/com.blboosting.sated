import { IEvent } from './event.interface';
import { Client, CommandInteraction, Interaction, TextChannel } from 'discord.js';
import { DiscordEvent } from '../constants/discord-event.enum';
import { ConfigEnv } from '../config.env';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { COMMAND_NAMES } from '../commands/command.interface';
import { EmojiReaction } from '../constants/emoji.enum';

export class RemoveDungeonBoosterEvent implements IEvent {
    private static readonly EMOJIS_TO_CLEAN = [EmojiReaction.TANK, EmojiReaction.HEALER, EmojiReaction.DPS, EmojiReaction.KEYSTONE];
    private readonly boostRepository = new BoostsRepository();

    async run(client: Client, interaction: Interaction): Promise<void> {
        const guild = await client.guilds.fetch(ConfigEnv.getConfig().DISCORD_GUILD);
        const channel = await guild.channels.fetch(interaction.channelId) as TextChannel;
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
        entity.signups.tanks = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        entity.signups.healers = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        entity.signups.dpses = entity.signups.tanks.filter(item => item.boosterId !== user.id);
        await this.boostRepository.update({ channelId: channel.id }, entity);

        for (const emoji of RemoveDungeonBoosterEvent.EMOJIS_TO_CLEAN) {
            const reaction = message.reactions.resolve(emoji);
            reaction.users.remove(user.id);
        }
        await command.reply({
            ephemeral: true,
            content: `Booster removed
Booster <@${user.id}> is now removed!`
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