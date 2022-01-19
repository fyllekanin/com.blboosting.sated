import { Client, Intents } from 'discord.js';
import { CreateDungeonBoostEvent } from './events/create-dungeon-boost.event';
import { DatabaseService } from './persistance/database.service';
import { SignDungeonBoostEvent } from './events/sign-dungeon-boost.event';
import { EventBus } from './internal-events/event.bus';
import { UnSignDungeonBoostEvent } from './events/un-sign-dungeon-boost.event';
import { UpdateDungeonSignupsStartup } from './startup/update-dungeon-signups.startup';

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

        const eventBus = new EventBus(this.client);

        this.client.on('ready', async () => {
            console.log('Logged in');
            await (new UpdateDungeonSignupsStartup()).run(this.client, eventBus);

            const events = [
                new CreateDungeonBoostEvent(),
                new SignDungeonBoostEvent(eventBus),
                new UnSignDungeonBoostEvent(eventBus)
            ];

            for (const eventItem of events) {
                this.client.on(eventItem.getEventName(), eventItem.run.bind(eventItem, this.client));
            }
        });
        this.client.login(process.env.BOT_TOKEN).catch(err => {
            console.error(`Shit went wrong, ${err}`);
        });
    }

}

(async () => {
    const main = new Main();
    await main.start();
})();