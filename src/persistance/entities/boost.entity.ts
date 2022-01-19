import { BaseEntity } from './base.entity';
import { SourceKey } from '../../constants/source.enum';
import { FactionKey } from '../../constants/faction.enum';

export interface BoostEntity extends BaseEntity {
    channelId: string;
    messageId: string;
    contact: {
        name: string;
        realm: string;
    },
    source: SourceKey;
    payments: Array<{
        amount: number;
        realm: string;
        faction: FactionKey;
        collectorId: string;
        isBalance: boolean;
    }>;
    discount: number;
    stack: Array<string>;
    advertiserId: string;
    notes: string;
    key: {
        dungeon: string;
        level: string | number;
        isTimed: boolean;
        runs: number;
    },
    boosters: {
        tank?: string;
        healer?: string;
        dpsOne?: string;
        dpsTwo?: string;
        keyholder?: string;
    },
    signups: {
        tanks: Array<{ boosterId: string, haveKey: boolean, createdAt: number }>;
        healers: Array<{ boosterId: string, haveKey: boolean, createdAt: number }>;
        dpses: Array<{ boosterId: string, haveKey: boolean, createdAt: number }>;
    },
    status: {
        isCollected?: boolean;
        isStarted?: boolean;
        isCompleted?: boolean;
        isDepleted?: boolean;
    }
}