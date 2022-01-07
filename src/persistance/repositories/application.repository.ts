import { ApplicationEntity } from '../entities/application.entity';
import { ConnectionService } from '../connection.service';
import { ObjectId } from 'mongodb';

export class ApplicationRepository {
    private static readonly COLLECTION = 'applications';

    async get(objectId: ObjectId): Promise<ApplicationEntity> {
        const database = await ConnectionService.get();
        return await database.collection(ApplicationRepository.COLLECTION)
            .findOne<ApplicationEntity>(objectId);
    }

    async insert(entity: ApplicationEntity): Promise<ApplicationEntity> {
        const database = await ConnectionService.get();
        const insertEntity = {
            ...entity,
            ...{
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime()
            }
        };
        const result = await database.collection(ApplicationRepository.COLLECTION).insertOne(insertEntity);
        return {
            ...insertEntity,
            _id: result.insertedId
        };
    }

    async setFinalState(id: string | ObjectId, isAccepted: boolean, managerId: string): Promise<void> {
        const database = await ConnectionService.get();
        await database.collection(ApplicationRepository.COLLECTION).updateOne({ _id: id }, {
            $set: {
                isAccepted: isAccepted,
                managerId: managerId,
                isArchived: true,
                updatedAt: new Date().getTime()
            }
        });
    }
}