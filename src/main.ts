import { Client, Intents } from 'discord.js';
import { CreateBoostEvent } from './events/dungeon-boost-events/create-boost.event';
import { DatabaseService } from './persistance/database.service';
import { SignBoostEvent } from './events/dungeon-boost-events/sign-boost.event';
import { EventBus } from './internal-events/event.bus';
import { UnSignBoostEvent } from './events/dungeon-boost-events/un-sign-boost.event';
import { UpdateDungeonSignupsStartup } from './startup/update-dungeon-signups.startup';
import { ConfigEnv } from './config.env';
import { DowngradeBoostEvent } from './events/dungeon-boost-events/downgrade-boost.event';
import { CancelBoostEvent } from './events/dungeon-boost-events/cancel-boost.event';
import { CollectedBoostEvent } from './events/dungeon-boost-events/collected-boost.event';
import { CompleteBoostEvent } from './events/dungeon-boost-events/complete-boost.event';
import { RemoveDungeonBoosterCommand } from './commands/remove-dungeon-booster.command';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { RemoveBoostEvent } from './events/dungeon-boost-events/remove-boost.event';
import { AddDungeonBoosterCommand } from './commands/add-dungeon-booster.command';
import { AddBoosterEvent } from './events/dungeon-boost-events/add-booster.event';
import { ActivityTypes } from 'discord.js/typings/enums';
import { GoogleSheetService } from './google-sheet.service';

require('dotenv').config();

class Main {
    private readonly client: Client;
    private readonly rest: REST;

    constructor() {
        ConfigEnv.load();
        this.rest = new REST({ version: '9' }).setToken(ConfigEnv.getConfig().BOT_TOKEN);
        this.client = new Client({
            restTimeOffset: 0,
            intents: new Intents([
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_INTEGRATIONS
            ]),
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        });
    }

    async start(): Promise<void> {
        await DatabaseService.startup();
        await GoogleSheetService.startup();

        const eventBus = new EventBus(this.client);

        this.client.on('ready', async () => {
            console.log('Logged in');
            this.client.user.setActivity({
                name: 'Loading...',
                type: ActivityTypes.STREAMING
            });
            await (new UpdateDungeonSignupsStartup()).run(this.client, eventBus);

            const events = [
                new CreateBoostEvent(eventBus),
                new SignBoostEvent(eventBus),
                new UnSignBoostEvent(eventBus),
                new DowngradeBoostEvent(),
                new CancelBoostEvent(),
                new CollectedBoostEvent(eventBus),
                new CompleteBoostEvent(),
                new RemoveBoostEvent(eventBus),
                new AddBoosterEvent(eventBus)
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
            this.client.user.setActivity({
                name: 'Let go!',
                type: ActivityTypes.PLAYING
            });
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