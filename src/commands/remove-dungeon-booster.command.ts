import { COMMAND_NAMES, ICommand } from './command.interface';
import { SlashCommandBuilder } from '@discordjs/builders';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types';

export class RemoveDungeonBoosterCommand implements ICommand {

    getCommand(): RESTPostAPIApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName(COMMAND_NAMES.REMOVE_DUNGEON_BOOSTER)
            .setDescription('Removes a booster from the boost')
            .addUserOption(option => option.setName('user').setDescription('The booster to remove').setRequired(true))
            .toJSON();
    }
}