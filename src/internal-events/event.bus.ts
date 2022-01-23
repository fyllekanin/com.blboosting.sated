import { OnDungeonBoostSignupChangeEvent } from './events/on-dungeon-boost-signup-change.event';
import { InternalEventInterface } from './internal-event.interface';
import { Client } from 'discord.js';
import { StartDungeonBoostEvent } from './events/start-dungeon-boost.event';
import { SendBoostersInformationEvent } from './events/send-boosters-information.event';

export enum INTERNAL_EVENT {
    DUNGEON_BOOST_SIGNUP_CHANGE = 'DUNGEON_BOOST_SIGNUP_CHANGE',
    START_DUNGEON_BOOST = 'START_DUNGEON_BOOST',
    SEND_BOOSTERS_INFORMATION = 'SEND_BOOSTERS_INFORMATION'
}

export class EventBus {
    private readonly INTERNAL_EVENT_MAPPER: { [key: string]: InternalEventInterface } = {};

    constructor(client: Client) {
        this.INTERNAL_EVENT_MAPPER = {
            DUNGEON_BOOST_SIGNUP_CHANGE: new OnDungeonBoostSignupChangeEvent(client, this),
            START_DUNGEON_BOOST: new StartDungeonBoostEvent(client, this),
            SEND_BOOSTERS_INFORMATION: new SendBoostersInformationEvent(client)
        }
    }

    emit(event: INTERNAL_EVENT, data?: number | string): void {
        if (this.INTERNAL_EVENT_MAPPER[event]) {
            this.INTERNAL_EVENT_MAPPER[event].run(data);
        }
    }
}