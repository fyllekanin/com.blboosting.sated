export type DungeonKey = 'ANY' | 'DOS' | 'HOA' | 'MISTS' | 'PLAGUE' | 'SD' | 'SOA' | 'NW' | 'TOP' | 'TAZ';

export const Dungeon: { [key: string]: { value: DungeonKey, label: string } } = {
    ANY: {
        label: 'Any',
        value: 'ANY'
    },
    DOS: {
        label: 'De Other Side',
        value: 'DOS'
    },
    HOA: {
        label: 'Halls of Atonement',
        value: 'HOA'
    },
    MISTS: {
        label: 'Mists of Tirna Scithe',
        value: 'MISTS'
    },
    PLAGUE: {
        label: 'Plaguefall',
        value: 'PLAGUE'
    },
    SD: {
        label: 'Sanguine Depths',
        value: 'SD'
    },
    SOA: {
        label: 'Spires of Ascenscion',
        value: 'SOA'
    },
    NW: {
        label: 'The Necrotic Wake',
        value: 'NW'
    },
    TOP: {
        label: 'Theater of Pain',
        value: 'TOP'
    },
    TAZ: {
        label: 'Tazavesh',
        value: 'TAZ'
    }
}

export const DungeonLevelConvert = function (dungeon: DungeonKey, level: string): { level: number, timed: boolean } {
    switch (dungeon) {
        case Dungeon.TAZ.value:
            return level === 'HM' ? { level: 15, timed: true } : { level: 15, timed: false };
    }
    return null;
};