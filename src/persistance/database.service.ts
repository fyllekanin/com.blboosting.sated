import { Collection, Db, MongoClient } from 'mongodb';
import { ConfigEnv } from '../config.env';

export class DatabaseService {
    private static connection: {
        client?: MongoClient;
        db?: Db;
    } = {};

    static async startup(): Promise<void> {
        this.connection.client = await new MongoClient(ConfigEnv.getConfig().MONGODB_HOST, {
            auth: ConfigEnv.getConfig().MONGODB_USERNAME ? {
                username: ConfigEnv.getConfig().MONGODB_USERNAME,
                password: ConfigEnv.getConfig().MONGODB_PASSWORD
            } : undefined
        }).connect();
        this.connection.db = this.connection.client.db(ConfigEnv.getConfig().MONGODB_DATABASE);
    }

    static getCollection<T>(collection: string): Collection<T> {
        return this.connection.db.collection(collection);
    }
}