import { EmbedInterface } from './embed.interface';
import { MessageEmbed } from 'discord.js';

interface Booster {
    boosterId: string;
    isTank: boolean;
    isHealer: boolean;
    isDps: boolean
}

export class MythicPlusEmbed implements EmbedInterface {
    private title: string;
    private boosters: Array<Booster> = [];
    private stacks: Array<string> = [];
    private key: { dungeon: string, level: number | string };
    private isTimed: boolean;
    private boosterPot: number;
    private totalPot: number;
    private source: string;
    private payments: Array<{ realm: string, faction: string }> = [];
    private advertiserId: string;

    withTitle(title: string): MythicPlusEmbed {
        this.title = title;
        return this;
    }

    withBoosters(boosters: Array<Booster>): MythicPlusEmbed {
        this.boosters = [...boosters];
        return this;
    }

    withStacks(stacks: Array<string>): MythicPlusEmbed {
        this.stacks = [...stacks];
        return this;
    }

    withKey(key: { dungeon: string, level: number | string }): MythicPlusEmbed {
        this.key = { ...key };
        return this;
    }

    withIsTimed(isTimed: boolean): MythicPlusEmbed {
        this.isTimed = isTimed;
        return this;
    }

    withBoosterPot(boosterPot: number): MythicPlusEmbed {
        this.boosterPot = boosterPot;
        return this;
    }

    withTotalPot(totalPot: number): MythicPlusEmbed {
        this.totalPot = totalPot;
        return this;
    }

    withSource(source: string): MythicPlusEmbed {
        this.source = source;
        return this;
    }

    withPayments(payments: Array<{ realm: string, faction: string }>): MythicPlusEmbed {
        this.payments = [...payments];
        return this;
    }

    withAdvertiserId(advertiserId: string): MythicPlusEmbed {
        this.advertiserId = advertiserId;
        return this;
    }

    generate(): MessageEmbed {
        const payments = this.payments.map(payment => `${payment.realm} [${payment.faction}]`).join('\n');
        return new MessageEmbed()
            .setTitle(this.title)
            .addFields([
                { name: 'Boosters', value: this.getBoosters() },
                { name: 'Armor Stack', value: this.stacks.join(', '), inline: true },
                { name: 'Key', value: `${this.key.dungeon} +${this.key.level}`, inline: true },
                { name: 'Timed', value: this.isTimed ? 'Yes' : 'No', inline: true },
                {
                    name: 'Booster pot',
                    value: `💰 ${this.boosterPot.toLocaleString()}`,
                    inline: true
                },
                { name: 'Total pot', value: `💰 ${this.totalPot.toLocaleString()}`, inline: true },
                { name: 'Source', value: `${this.source}`, inline: true },
                { name: 'Server Payment(s)', value: payments, inline: true },
                { name: 'Advertiser', value: `<@${this.advertiserId}>`, inline: true }
            ])
    }

    private getBoosters(): string {
        const tank = this.boosters.find(item => item.isTank);
        const healer = this.boosters.find(item => item.isHealer);
        const dpses = this.boosters.filter(item => item.isDps);

        return [
            `🛡️${tank?.boosterId ? `<@${tank.boosterId}>` : ''}`,
            `🩹${healer?.boosterId ? `<@${healer.boosterId}>` : ''}`,
            `⚔${dpses[0]?.boosterId ? `<@${dpses[0].boosterId}>` : ''}`,
            `⚔${dpses[1]?.boosterId ? `<@${dpses[1].boosterId}>` : ''}`
        ].join('\n');
    }
}