export interface InternalEventInterface {
    run(data: any): Promise<void>;
}