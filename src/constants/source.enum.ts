export type SourceKey = 'TICKET' | 'TICKET_IN_HOUSE' | 'TRADE_CHAT' | 'DISCORD';

export const Source: { [key: string]: { value: SourceKey, label: string } } = {
    TICKET: {
        label: 'Ticket',
        value: 'TICKET'
    },
    TICKET_IN_HOUSE: {
        label: 'Ticket In House',
        value: 'TICKET_IN_HOUSE'
    },
    TRADE_CHAT: {
        label: 'Trade Chat',
        value: 'TRADE_CHAT'
    },
    DISCORD: {
        label: 'Discord',
        value: 'DISCORD'
    }
}
