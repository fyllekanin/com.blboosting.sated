import { Schema } from 'jsonschema';

export interface IDungeonBoost {
    source: 'TICKET' | 'TICKET_IN_HOUSE' | 'TRADE_CHAT' | 'DISCORD';
    payments: Array<{ amount: number, realm: string, faction: 'Horde' | 'Alliance', collectorId: string, isBalance: boolean }>;
    discount: number;
    stack: Array<string>;
    advertiser: { advertiserId: string, playing: boolean, role: 'Tank' | 'Healer' | 'DPS' },
    notes: string;
    contact: {
        name: string;
        realm: string;
    }
    key: {
        dungeon: 'ANY' | 'DOS' | 'HOA' | 'MISTS' | 'PLAGUE' | 'SD' | 'SOA' | 'NW' | 'TOP' | 'TAZ',
        level: number | string;
        isTimed: boolean;
        runs: number;
        booster: {
            boosterId: string;
            role: 'Tank' | 'Healer' | 'DPS'
        }
    },
    boosters: Array<{
        boosterId: string,
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
        source: {
            type: 'string',
            enum: ['TC', 'TCL', 'TIH', 'D']
        },
        payments: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    amount: { type: 'number' },
                    realm: { type: 'string' },
                    faction: { type: 'string', enum: ['HORDE', 'ALLIANCE'] },
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
                enum: [
                    'Cloth',
                    'Leather',
                    'Mail',
                    'Plate',
                    'Mage',
                    'Priest',
                    'Warlock',
                    'Demon Hunter',
                    'Druid',
                    'Monk',
                    'Rogue',
                    'Hunter',
                    'Shaman',
                    'Death Knight',
                    'Paladin',
                    'Warrior',
                    'ANY'
                ]
            }
        },
        advertiser: {
            type: 'object',
            properties: {
                advertiserId: { type: 'string' },
                playing: { type: 'boolean' },
                role: { type: ['string', 'null'], enum: ['Tank', 'Healer', 'DPS', null] }
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
                    enum: [
                        'ANY',
                        'DOS',
                        'HOA',
                        'MISTS',
                        'PLAGUE',
                        'SD',
                        'SOA',
                        'NW',
                        'TOP',
                        'TAZ'
                    ]
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
                    isKeyHolder: { type: 'boolean' }
                }
            },
            required: ['boosterId', 'isKeyHolder']
        }
    },
    required: [
        'contact',
        'source',
        'payments',
        'discount',
        'key',
        'stack'
    ]
};