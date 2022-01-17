import { Client, Intents } from 'discord.js';
import { CreateDungeonBoostEvent } from './events/create-dungeon-boost.event';
import { DatabaseService } from './persistance/database.service';
import { SignDungeonBoostEvent } from './events/sign-dungeon-boost.event';

require('dotenv').config();

class Main {
    private readonly client: Client;

    constructor() {
        this.client = new Client({
            intents: new Intents([
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS
            ]),
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        });
    }

    async start(): Promise<void> {
        await DatabaseService.startup();

        this.client.on('ready', async () => {
            console.log('Logged in');
            [
                new CreateDungeonBoostEvent(),
                new SignDungeonBoostEvent()
            ].forEach(evt => {
                this.client.on(evt.getEventName(), evt.run.bind(evt, this.client));
            });
        });
        this.client.on('messageReactionAdd', () => console.log('gg'));
        this.client.login(process.env.BOT_TOKEN).catch(err => {
            console.error(`Shit went wrong, ${err}`);
        });
    }

}

(async () => {
    const main = new Main();
    await main.start();
})();