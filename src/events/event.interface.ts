
export interface IEvent {
    run: Function;
    getEventName: () => string;
}