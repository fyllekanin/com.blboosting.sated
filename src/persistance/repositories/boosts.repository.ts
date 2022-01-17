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

    protected getCollection(): Collection<BoostEntity> {
        if (this.repository) {
            return this.repository;
        }
        this.repository = DatabaseService.getCollection(BoostsRepository.COLLECTION);
        return this.repository;
    }
}