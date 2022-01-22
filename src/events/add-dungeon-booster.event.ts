import { IEvent } from './event.interface';
import { Client, CommandInteraction, Interaction, TextChannel } from 'discord.js';
import { DiscordEvent } from '../constants/discord-event.enum';
import { ConfigEnv } from '../config.env';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { COMMAND_NAMES } from '../commands/command.interface';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';
import { BoosterRole } from '../constants/role.constant';

export class AddDungeonBoosterEvent implements IEvent {
    private readonly boostRepository = new BoostsRepository();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    async run(client: Client, interaction: Interaction): Promise<void> {
        const guild = await client.guilds.fetch(ConfigEnv.getConfig().DISCORD_GUILD);
        const channel = await guild.channels.fetch(interaction.channelId) as TextChannel;
        if (!await this.isApplicable(channel, interaction)) {
            return;
        }
        const command = interaction as CommandInteraction;
        const entity = await this.boostRepository.getBoostForChannel(channel.id);
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
        const role = command.options.getString('role');
        const haveKey = command.options.getBoolean('key');

        switch (role) {
            case BoosterRole.TANK.value:
                if (entity.boosters.tank) {
                    await command.reply({
                        ephemeral: true,
                        content: `The tank role is already taken, you need to remove before adding`
                    });
                    return;
                }
                entity.boosters.tank = user.id;
                entity.boosters.keyholder = entity.boosters.keyholder || !haveKey ? entity.boosters.keyholder : user.id;
                entity.signups.tanks = entity.signups.tanks.some(item => item.boosterId === user.id) ? entity.signups.tanks : [...entity.signups.tanks, ...[{
                    boosterId: user.id,
                    haveKey: haveKey,
                    createdAt: new Date().getTime()
                }]];
                break;
            case BoosterRole.HEALER.value:
                if (entity.boosters.healer) {
                    await command.reply({
                        ephemeral: true,
                        content: `The healer role is already taken, you need to remove before`
                    });
                    return;
                }
                entity.boosters.healer = user.id;
                entity.boosters.keyholder = entity.boosters.keyholder || !haveKey ? entity.boosters.keyholder : user.id;
                entity.signups.healers = entity.signups.healers.some(item => item.boosterId === user.id) ? entity.signups.healers : [...entity.signups.healers, ...[{
                    boosterId: user.id,
                    haveKey: haveKey,
                    createdAt: new Date().getTime()
                }]];
                break;
            case BoosterRole.DPS.value:
                if (entity.boosters.dpsOne && entity.boosters.dpsTwo) {
                    await command.reply({
                        ephemeral: true,
                        content: `The dps role is already taken, you need to remove before`
                    });
                    return;
                }
                if (!entity.boosters.dpsOne) {
                    entity.boosters.dpsOne = user.id;
                } else {
                    entity.boosters.dpsTwo = user.id;
                }
                entity.boosters.keyholder = entity.boosters.keyholder || !haveKey ? entity.boosters.keyholder : user.id;
                entity.signups.dpses = entity.signups.dpses.some(item => item.boosterId === user.id) ? entity.signups.dpses : [...entity.signups.dpses, ...[{
                    boosterId: user.id,
                    haveKey: haveKey,
                    createdAt: new Date().getTime()
                }]];
                break;
            default:
                await command.reply({ ephemeral: true, content: `The role provided is not valid` });
                return;
        }

        await this.boostRepository.update({ channelId: channel.id }, entity);
        this.eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE);

        await command.reply({
            ephemeral: true,
            content: `Booster added
Booster <@${user.id}> is now added!`
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
            interaction.commandName === COMMAND_NAMES.ADD_DUNGEON_BOOSTER;
    }
}