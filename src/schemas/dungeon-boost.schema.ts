import { Schema } from 'jsonschema';
import { Dungeon, DungeonKey } from '../constants/dungeon.enum';
import { BoosterRole, RoleKey } from '../constants/role.constant';
import { Source, SourceKey } from '../constants/source.enum';
import { Faction, FactionKey } from '../constants/faction.enum';
import { Stack, StackKey } from '../constants/Stack.enum';

export interface IDungeonBoost {
    faction: FactionKey,
    source: SourceKey;
    payments: Array<{ amount: number, realm: string, faction: FactionKey, collectorId: string, isBalance: boolean }>;
    discount: number;
    stack: Array<StackKey>;
    advertiserId: string,
    notes: string;
    contact: {
        name: string;
        realm: string;
    }
    key: {
        dungeon: DungeonKey,
        level: number | string;
        isTimed: boolean;
        runs: number;
    },
    boosters: Array<{
        boosterId: string,
        role: RoleKey,
        isKeyHolder: boolean
    }>
}

export const DungeonBoostSchema: Schema = {
    id: '/DungeonBoost',
    type: 'object',
    properties: {
        contact: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                realm: { type: 'realm' }
            },
            required: ['name', 'realm']
        },
        faction: {
            type: 'string',
            enum: Object.keys(Faction)
        },
        source: {
            type: 'string',
            enum: Object.keys(Source)
        },
        payments: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    amount: { type: 'number' },
                    realm: { type: 'string' },
                    faction: { type: 'string', enum: Object.keys(Faction) },
                    collectorId: { type: 'string' },
                    isBalance: { type: 'boolean' }
                }
            }
        },
        discount: { type: ['number', 'null'] },
        stack: {
            type: 'array',
            items: {
                type: 'string',
                enum: Object.keys(Stack)
            }
        },
        advertiser: {
            type: 'object',
            properties: {
                advertiserId: { type: 'string' },
                playing: { type: 'boolean' },
                role: { type: ['string', 'null'], enum: [...Object.keys(BoosterRole), ...[null]] }
            },
            required: ['advertiserId']
        },
        notes: {
            type: 'string'
        },
        key: {
            type: 'object',
            properties: {
                dungeon: {
                    type: 'string',
                    enum: Object.keys(Dungeon)
                },
                level: { type: ['number', 'string'] },
                runs: { type: 'number', minimum: 1 },
                isTimed: { type: 'boolean' }
            },
            required: ['dungeon', 'level', 'runs', 'isTimed']
        },
        boosters: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    boosterId: { type: 'string' },
                    role: { type: 'string', enum: Object.keys(BoosterRole) },
                    isKeyHolder: { type: 'boolean' }
                }
            },
            required: ['boosterId', 'isKeyHolder', 'role']
        }
    },
    required: [
        'contact',
        'source',
        'payments',
        'discount',
        'key',
        'stack',
        'faction'
    ]
};