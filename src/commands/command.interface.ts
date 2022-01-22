import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types';

export const COMMAND_NAMES = {
    REMOVE_DUNGEON_BOOSTER: 'remove-dungeon-booster',
    STOP_DUNGEON_BOOSTER: 'stop-dungeon-boost'
};

export interface ICommand {
    getCommand(): RESTPostAPIApplicationCommandsJSONBody;
}