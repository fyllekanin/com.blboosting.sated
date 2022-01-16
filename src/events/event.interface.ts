
export interface IEvent {
    run: Function;
    isApplicable: Function;

    getEventName: () => string;
}