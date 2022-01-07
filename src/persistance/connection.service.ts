import { Db, MongoClient } from 'mongodb';

export class ConnectionService {
    private static NAME = 'blb';
    private static database: Db;

    static async get(): Promise<Db> {
        if (this.database) {
            return this.database;
        }
        const client = await new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        this.database = client.db(this.NAME);
        return this.database;
    }
}