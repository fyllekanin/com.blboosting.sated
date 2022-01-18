import { OnDungeonBoostSignupChangeEvent } from './events/on-dungeon-boost-signup-change.event';
import { InternalEventInterface } from './internal-event.interface';

const INTERNAL_EVENT_MAPPER: { [key: string]: InternalEventInterface } = {
    DUNGEON_BOOST_SIGNUP_CHANGE: new OnDungeonBoostSignupChangeEvent()
}

export enum INTERNAL_EVENT {
    DUNGEON_BOOST_SIGNUP_CHANGE = 'DUNGEON_BOOST_SIGNUP_CHANGE'
}

export class EventBus {

    emit(event: INTERNAL_EVENT, data: any): void {
        if (INTERNAL_EVENT_MAPPER[event]) {
            INTERNAL_EVENT_MAPPER[event].run(data);
        }
    }
}