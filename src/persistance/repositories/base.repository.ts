import { Collection, DeleteResult, Filter, ObjectId, OptionalId, OptionalUnlessRequiredId, WithId } from 'mongodb';

export abstract class BaseRepository<T extends { _id?: ObjectId, createdAt?: number, updatedAt?: number }> {

    async insert(entity: T): Promise<T> {
        entity.createdAt = new Date().getTime();
        entity.updatedAt = new Date().getTime();

        const result = await this.getCollection().insertOne(entity as OptionalUnlessRequiredId<T>);

        entity._id = new ObjectId(result.insertedId);
        return entity;
    }

    async insertMany(entities: Array<T>): Promise<void> {
        entities.forEach(entity => {
            entity.createdAt = new Date().getTime();
            entity.updatedAt = new Date().getTime();
        });
        await this.getCollection().insertMany(entities as Array<OptionalUnlessRequiredId<T>>);
    }

    async update(filter: Filter<T>, entity: T): Promise<T> {
        entity.updatedAt = new Date().getTime();
        const body = { ...entity };
        delete body._id;

        await this.getCollection().updateOne(filter, {
            $set: body
        });
        return entity;
    }

    async delete(entity: OptionalId<T>): Promise<DeleteResult> {
        return await this.getCollection().deleteMany(entity);
    }

    async getAll(): Promise<Array<WithId<T>>> {
        return await this.getCollection().find().toArray();
    }

    async clear(): Promise<void> {
        await this.getCollection().deleteMany({});
    }

    protected abstract getCollection(): Collection<T>;
}