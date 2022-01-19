export type StackKey =
    'CLOTH'
    | 'LEATHER'
    | 'MAIL'
    | 'PLATE'
    | 'MAGE'
    | 'PRIEST'
    |
    'WARLOCK'
    | 'DRUID'
    | 'DEMON_HUNTER'
    | 'MONK'
    | 'ROGUE'
    | 'HUNTER'
    | 'SHAMAN'
    | 'WARRIOR'
    | 'PALADIN'
    | 'DEATH_KNIGHT';

export const Stack: { [key: string]: { value: StackKey, label: string } } = {
    CLOTH: {
        label: 'Cloth',
        value: 'CLOTH'
    },
    LEATHER: {
        label: 'Leather',
        value: 'LEATHER'
    },
    MAIL: {
        label: 'Mail',
        value: 'MAIL'
    },
    PLATE: {
        label: 'Plate',
        value: 'PLATE'
    },
    PRIEST: {
        label: 'Priest',
        value: 'PRIEST'
    },
    WARLOCK: {
        label: 'Warlock',
        value: 'WARLOCK'
    },
    DRUID: {
        label: 'Druid',
        value: 'DRUID'
    },
    DEMON_HUNTER: {
        label: 'Demon Hunter',
        value: 'DEMON_HUNTER'
    },
    MONK: {
        label: 'Monk',
        value: 'MONK'
    },
    ROGUE: {
        label: 'Rogue',
        value: 'ROGUE'
    },
    HUNTER: {
        label: 'Hunter',
        value: 'HUNTER'
    },
    SHAMAN: {
        label: 'Shaman',
        value: 'SHAMAN'
    },
    WARRIOR: {
        label: 'Warrior',
        value: 'WARRIOR'
    },
    PALADIN: {
        label: 'Paladin',
        value: 'PALADIN'
    },
    DEATH_KNIGHT: {
        label: 'Death Knight',
        value: 'DEATH_KNIGHT'
    }
}
