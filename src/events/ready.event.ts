import { IEvent } from './event.interface';

export class ReadyEvent implements IEvent {
    run(): void {
        console.log('im ready');
    }

    getEventName(): string {
        return 'ready';
    }
}