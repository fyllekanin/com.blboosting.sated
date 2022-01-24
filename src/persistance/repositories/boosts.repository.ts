import { BoostEntity } from '../entities/boost.entity';
import { BaseRepository } from './base.repository';
import { Collection } from 'mongodb';
import { DatabaseService } from '../database.service';

export class BoostsRepository extends BaseRepository<BoostEntity> {
    private static readonly COLLECTION = 'boosts';
    protected repository: Collection<BoostEntity>;

    async isBoostChannel(channelId: string): Promise<boolean> {
        return await this.getCollection().countDocuments({ channelId: channelId }) > 0;
    }

    async getBoostForChannel(channelId: string): Promise<BoostEntity> {
        return await this.getCollection().findOne({ channelId: channelId });
    }

    async getBoostForCollectorMessage(collectorMessageId: string): Promise<BoostEntity> {
        return await this.getCollection().findOne({ collectorMessageId: collectorMessageId });
    }

    async getBoostsForChannels(channelIds: Array<string>): Promise<Array<BoostEntity>> {
        return await this.getCollection().find({ channelId: { $in: channelIds } }).toArray();
    }

    async deleteBoostWithChannel(channelId: string): Promise<void> {
        await this.getCollection().deleteOne({ channelId: channelId });
    }

    async isInActiveBoost(userId: string): Promise<boolean> {
        return (await this.getCollection().find({
            $and: [
                {
                    $or: [
                        { 'boosters.tank': userId },
                        { 'boosters.healer': userId },
                        { 'boosters.dpsOne': userId },
                        { 'boosters.dpsTwo': userId }
                    ]
                },
                { 'status.isStarted': true },
                { 'status.isCompleted': false },
                { 'status.isDepleted': false }
            ]
        }).count()) > 0;
    }

    protected getCollection(): Collection<BoostEntity> {
        if (this.repository) {
            return this.repository;
        }
        this.repository = DatabaseService.getCollection(BoostsRepository.COLLECTION);
        return this.repository;
    }
}