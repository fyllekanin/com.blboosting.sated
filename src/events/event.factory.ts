import { IEvent } from './event.interface';
import { MessageCreateEvent } from './message-create.event';
import { ReadyEvent } from './ready.event';
import { InteractionCreateEvent } from '../events/interaction-create.event';

const events = [
    new MessageCreateEvent(),
    new ReadyEvent(),
    new InteractionCreateEvent()
];


export class EventFactory {

    static getEvents(): Map<string, IEvent> {
        return events.reduce((map, event) => {
            map.set(event.getEventName(), event);
            return map;
        }, new Map<string, IEvent>());
    }
}