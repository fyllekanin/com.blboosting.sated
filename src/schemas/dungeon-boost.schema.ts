import { Schema } from 'jsonschema';

export interface IDungeonBoost {
    name: string;
    realm: string;
    source: 'TC' | 'TCL' | 'TIH' | 'D';
    payments: Array<{ amount: number, realm: string, faction: 'HORDE' | 'ALLIANCE', collectorId: string }>;
    paidBalance: number;
    discount: number;
    stack: Array<string>;
    advertiser: { advertiserId: string, playing: boolean, role: 'Tank' | 'Healer' | 'DPS' },
    notes: string;
    key: {
        dungeon: 'ANY' | 'DOS' | 'HOA' | 'MISTS' | 'PLAGUE' | 'SD' | 'SOA' | 'NW' | 'TOP' | 'TAZ',
        level: number | string;
        timed: boolean;
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
        name: {
            type: 'string'
        },
        realm: {
            type: 'string'
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
                    collectorId: { type: 'string' }
                }
            }
        },
        paidBalance: { type: ['number', 'null'] },
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
            }
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
                timed: { type: 'boolean' }
            }
        },
        boosters: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    boosterId: { type: 'string' },
                    isKeyHolder: { type: 'boolean' }
                }
            }
        }
    },
    required: [
        'name',
        'realm',
        'source',
        'payments',
        'discount',
        'paidBalance',
        'keys',
        'stack'
    ]
};