import { BaseEntity } from './base.entity';

export interface BoostEntity extends BaseEntity {
    channelId: string;
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
    }
}