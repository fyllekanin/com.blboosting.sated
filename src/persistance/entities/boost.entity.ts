import { BaseEntity } from './base.entity';
import { SourceKey } from '../../constants/source.enum';
import { FactionKey } from '../../constants/faction.enum';
import { StackKey } from '../../constants/stack.enum';
import { DungeonKey } from '../../constants/dungeon.enum';

export interface BoostEntity extends BaseEntity {
    faction: FactionKey;
    channelId: string;
    messageId: string;
    boostRoleId: string;
    contact: {
        name: string;
        realm: string;
    },
    source: SourceKey;
    collectorMessageId: string;
    payments: Array<{
        amount: number;
        realm: string;
        faction: FactionKey;
        collectorId: string;
        isBalance: boolean;
    }>;
    discount: number;
    stack: Array<StackKey>;
    advertiserId: string;
    notes: string;
    key: {
        dungeon: DungeonKey;
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
        isCollected: boolean;
        isStarted: boolean;
        isCompleted: boolean;
        isDepleted: boolean;
    }
}