export interface InternalEventInterface {
    run(data?: number | string): Promise<void>;
}