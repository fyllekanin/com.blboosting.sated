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
import { RemoveDungeonBoosterCommand } from './commands/remove-dungeon-booster.command';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { RemoveDungeonBoosterEvent } from './events/remove-dungeon-booster.event';
import { AddDungeonBoosterCommand } from './commands/add-dungeon-booster.command';
import { AddDungeonBoosterEvent } from './events/add-dungeon-booster.event';

require('dotenv').config();

class Main {
    private readonly client: Client;
    private readonly rest: REST;

    constructor() {
        ConfigEnv.load();
        this.rest = new REST({ version: '9' }).setToken(ConfigEnv.getConfig().BOT_TOKEN);
        this.client = new Client({
            intents: new Intents([
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_INTEGRATIONS
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
                new CompleteDungeonBoostEvent(),
                new RemoveDungeonBoosterEvent(eventBus),
                new AddDungeonBoosterEvent(eventBus)
            ];

            for (const eventItem of events) {
                this.client.on(eventItem.getEventName(), eventItem.run.bind(eventItem, this.client));
            }

            const commands = [
                new RemoveDungeonBoosterCommand().getCommand(),
                new AddDungeonBoosterCommand().getCommand()
            ];
            await this.rest.put(Routes.applicationGuildCommands(ConfigEnv.getConfig().BOT_CLIENT_ID, ConfigEnv.getConfig().DISCORD_GUILD), { body: commands });
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