import { OnDungeonBoostSignupChangeEvent } from './events/on-dungeon-boost-signup-change.event';
import { InternalEventInterface } from './internal-event.interface';
import { Client } from 'discord.js';

export enum INTERNAL_EVENT {
    DUNGEON_BOOST_SIGNUP_CHANGE = 'DUNGEON_BOOST_SIGNUP_CHANGE'
}

export class EventBus {
    private readonly INTERNAL_EVENT_MAPPER: { [key: string]: InternalEventInterface } = {};

    constructor(client: Client) {
        this.INTERNAL_EVENT_MAPPER = {
            DUNGEON_BOOST_SIGNUP_CHANGE: new OnDungeonBoostSignupChangeEvent(client)
        }
    }

    emit(event: INTERNAL_EVENT, data: any): void {
        if (this.INTERNAL_EVENT_MAPPER[event]) {
            this.INTERNAL_EVENT_MAPPER[event].run(data);
        }
    }
}