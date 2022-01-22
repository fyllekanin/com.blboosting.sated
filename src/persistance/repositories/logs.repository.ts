import { BaseRepository } from './base.repository';
import { Collection } from 'mongodb';
import { DatabaseService } from '../database.service';
import { LogEntity } from '../entities/log.entity';

export class LogsRepository extends BaseRepository<LogEntity> {
    private static readonly COLLECTION = 'logs';
    protected repository: Collection<LogEntity>;

    protected getCollection(): Collection<LogEntity> {
        if (this.repository) {
            return this.repository;
        }
        this.repository = DatabaseService.getCollection(LogsRepository.COLLECTION);
        return this.repository;
    }
}