import { Client, Intents } from 'discord.js';
import { CreateDungeonBoostEvent } from './events/create-dungeon-boost.event';
import { DungeonBoostToolsEvent } from './events/dungeon-boost-tools.event';

require('dotenv').config();

class Main {
    private readonly client: Client;

    constructor() {

        this.client = new Client({
            intents: new Intents([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES])
        });

        [
            new CreateDungeonBoostEvent(),
            new DungeonBoostToolsEvent()
        ].forEach(evt => {
            this.client.on(evt.getEventName(), evt.run.bind(evt, this.client));
        });

        this.client.on('ready', () => console.log('Logged in'));
        this.client.login(process.env.BOT_TOKEN).catch(err => {
            console.error(`Shit went wrong, ${err}`);
        });
    }

}

new Main();