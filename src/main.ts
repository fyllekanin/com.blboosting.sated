import { Client, Intents } from 'discord.js';
import { IEvent } from './events/event.interface';
import { EventFactory } from './events/event.factory';

require('dotenv').config();

class Main {
    private readonly client: Client;
    private readonly events: Map<string, IEvent>;

    constructor() {
        this.events = EventFactory.getEvents();

        this.client = new Client({
            intents: new Intents(Number(process.env.INTENTS))
        });

        this.events.forEach((value, key) => {
            try {
                this.client.on(key, value.run.bind(value, this.client));
            } catch (ex) {
                console.error(`Event: ${key} crashed`);
            }
        });
        this.client.login(process.env.TOKEN).catch(err => {
            console.error(`Shit went wrong, ${err}`);
        });
    }

}

new Main();