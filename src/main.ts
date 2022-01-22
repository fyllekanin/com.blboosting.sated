import { Client, Intents } from 'discord.js';
import { CreateDungeonBoostEvent } from './events/create-dungeon-boost.event';
import { DatabaseService } from './persistance/database.service';
import { SignDungeonBoostEvent } from './events/sign-dungeon-boost.event';
import { EventBus } from './internal-events/event.bus';
import { UnSignDungeonBoostEvent } from './events/un-sign-dungeon-boost.event';
import { UpdateDungeonSignupsStartup } from './startup/update-dungeon-signups.startup';
import { ConfigEnv } from './config.env';
import { DowngradeDungeonBoostEvent } from './events/downgrade-dungeon-boost.event';
import { CancelDungeonBoostEvent } from './events/cancel-dungeon-boost.event';
import { CollectedDungeonBoostEvent } from './events/collected-dungeon-boost.event';
import { CompleteDungeonBoostEvent } from './events/complete-dungeon-boost.event';

require('dotenv').config();

class Main {
    private readonly client: Client;

    constructor() {
        ConfigEnv.load();
        this.client = new Client({
            intents: new Intents([
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS
            ])
        });
    }

    async start(): Promise<void> {
        await DatabaseService.startup();

        const eventBus = new EventBus(this.client);

        this.client.on('ready', async () => {
            console.log('Logged in');
            await (new UpdateDungeonSignupsStartup()).run(this.client, eventBus);

            const events = [
                new CreateDungeonBoostEvent(eventBus),
                new SignDungeonBoostEvent(eventBus),
                new UnSignDungeonBoostEvent(eventBus),
                new DowngradeDungeonBoostEvent(),
                new CancelDungeonBoostEvent(),
                new CollectedDungeonBoostEvent(eventBus),
                new CompleteDungeonBoostEvent()
            ];

            for (const eventItem of events) {
                this.client.on(eventItem.getEventName(), eventItem.run.bind(eventItem, this.client));
            }
            console.log('Everything ready');
        });
        this.client.login(ConfigEnv.getConfig().BOT_TOKEN).catch(err => {
            console.error(`Shit went wrong, ${err}`);
        });
    }

}

(async () => {
    const main = new Main();
    await main.start();
})();