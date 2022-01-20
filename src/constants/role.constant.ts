export type RoleKey = 'TANK' | 'HEALER' | 'DPS';

export const BoosterRole: { [key: string]: { value: RoleKey, label: string } } = {
    TANK: {
        label: 'Tank',
        value: 'TANK'
    },
    HEALER: {
        label: 'Healer',
        value: 'HEALER'
    },
    DPS: {
        label: 'DPS',
        value: 'DPS'
    }
}
