import { EmbedInterface } from './embed.interface';
import { MessageEmbed } from 'discord.js';
import { Faction, FactionKey } from '../constants/faction.enum';

export class CollectorEmbed implements EmbedInterface {
    private advertiserId: string;
    private boostId: string;
    private collectorId: string;
    private payments: Array<{ realm: string, faction: FactionKey, amount: number }> = [];

    withAdvertiserId(advertiserId: string): CollectorEmbed {
        this.advertiserId = advertiserId;
        return this;
    }

    withBoostId(boostId: string): CollectorEmbed {
        this.boostId = boostId;
        return this;
    }

    withCollectorId(collectorId: string): CollectorEmbed {
        this.collectorId = collectorId;
        return this;
    }

    withPayments(payments: Array<{ realm: string, faction: FactionKey, amount: number }>): CollectorEmbed {
        this.payments = payments;
        return this;
    }

    generate(): MessageEmbed {
        const paymentFields = this.payments.reduce((prev, curr, index) => {
            prev.push({
                name: index === 0 ? 'Realm' : '\u200b',
                value: curr.realm,
                inline: true
            });
            prev.push({
                name: index === 0 ? 'Faction' : '\u200b',
                value: Faction[curr.faction].label,
                inline: true
            });
            prev.push({
                name: index === 0 ? 'Amount' : '\u200b',
                value: `${curr.amount}`,
                inline: true
            });
            return prev;
        }, []);
        return new MessageEmbed()
            .setTitle('Gold Collecting Mythic+ Boost')
            .setColor('RED')
            .addFields([...[
                { name: 'Advertiser', value: `<@${this.advertiserId}>`, inline: true },
                { name: 'Channel', value: `<#${this.boostId}>`, inline: true },
                { name: 'Boost ID', value: `${this.boostId}`, inline: true }
            ], ...paymentFields, ...[{
                name: 'Collector',
                value: this.collectorId ? `<@${this.collectorId}>` : '\u200b'
            }]])
    }
}