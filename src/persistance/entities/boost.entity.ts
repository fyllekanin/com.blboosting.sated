import { BaseEntity } from './base.entity';

export interface BoostEntity extends BaseEntity {
    channelId: string;
    messageId: string;
    contact: {
        name: string;
        realm: string;
    },
    source: 'TICKET' | 'TICKET_IN_HOUSE' | 'TRADE_CHAT' | 'DISCORD';
    payments: Array<{
        amount: number;
        realm: string;
        faction: 'Horde' | 'Alliance';
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