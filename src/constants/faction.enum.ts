export type FactionKey = 'HORDE' | 'ALLIANCE';

export const Faction: { [key: string]: { value: FactionKey, label: string } } = {
    HORDE: {
        label: 'Horde',
        value: 'HORDE'
    },
    ALLIANCE: {
        label: 'Alliance',
        value: 'ALLIANCE'
    }
}
