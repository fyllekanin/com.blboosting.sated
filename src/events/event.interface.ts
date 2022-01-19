import { DiscordEvent } from '../constants/discord-event.enum';

export interface IEvent {
    run: Function;
    getEventName: () => DiscordEvent;
}