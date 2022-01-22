import { COMMAND_NAMES, ICommand } from './command.interface';
import { SlashCommandBuilder } from '@discordjs/builders';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types';
import { BoosterRole } from '../constants/role.constant';

export class AddDungeonBoosterCommand implements ICommand {

    getCommand(): RESTPostAPIApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName(COMMAND_NAMES.ADD_DUNGEON_BOOSTER)
            .setDescription('Adds a booster to the boost')
            .addUserOption(option => option.setName('user').setDescription('The booster to add').setRequired(true))
            .addStringOption(option => option.setName('role')
                .setDescription('Which role is the booster')
                .addChoice(BoosterRole.TANK.label, BoosterRole.TANK.value)
                .addChoice(BoosterRole.HEALER.label, BoosterRole.HEALER.value)
                .addChoice(BoosterRole.DPS.label, BoosterRole.DPS.value)
                .setRequired(true)
            )
            .addBooleanOption(option => option.setName('key').setDescription('Do the user have the key').setRequired(true))
            .toJSON();
    }
}