import { Client } from 'discord.js';
import { EventBus } from '../internal-events/event.bus';

export interface StartupInterface {
    run: (client: Client, eventBus: EventBus) => Promise<void | Array<void>>;
}