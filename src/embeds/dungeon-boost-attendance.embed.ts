import { EmbedInterface } from './embed.interface';
import { MessageEmbed } from 'discord.js';
import { Dungeon, DungeonKey } from '../constants/dungeon.enum';
import { Source, SourceKey } from '../constants/source.enum';
import { Stack, StackKey } from '../constants/stack.enum';
import { EmojiReaction } from '../constants/emoji.enum';
import { DungeonBoosterUtils } from '../utils/dungeon-booster.utils';

export class DungeonBoostAttendanceEmbed implements EmbedInterface {
    private boostId: string;
    private tankId: string;
    private healerId: string;
    private dpsOneId: string;
    private dpsTwoId: string;
    private advertiserId: string;
    private level: number | string;
    private runs: number;
    private dungeon: DungeonKey;
    private isTimed: boolean;
    private stacks: Array<StackKey>;
    private source: SourceKey;
    private totalPot: number;
    private notes: string;

    withBoostId(boostId: string): DungeonBoostAttendanceEmbed {
        this.boostId = boostId;
        return this;
    }

    withTankId(tankId: string): DungeonBoostAttendanceEmbed {
        this.tankId = tankId;
        return this;
    }

    withHealerId(healerId: string): DungeonBoostAttendanceEmbed {
        this.healerId = healerId;
        return this;
    }

    withDpsOneId(dpsOneId: string): DungeonBoostAttendanceEmbed {
        this.dpsOneId = dpsOneId;
        return this;
    }

    withDpsTwoId(dpsTwoId: string): DungeonBoostAttendanceEmbed {
        this.dpsTwoId = dpsTwoId;
        return this;
    }

    withAdvertiserId(advertiserId: string): DungeonBoostAttendanceEmbed {
        this.advertiserId = advertiserId;
        return this;
    }

    withLevel(level: number | string): DungeonBoostAttendanceEmbed {
        this.level = level;
        return this;
    }

    withRuns(runs: number): DungeonBoostAttendanceEmbed {
        this.runs = runs;
        return this;
    }

    withDungeon(dungeon: DungeonKey): DungeonBoostAttendanceEmbed {
        this.dungeon = dungeon;
        return this;
    }

    withIsTimed(isTimed: boolean): DungeonBoostAttendanceEmbed {
        this.isTimed = isTimed;
        return this;
    }

    withStacks(stacks: Array<StackKey>): DungeonBoostAttendanceEmbed {
        this.stacks = stacks;
        return this;
    }

    withSource(source: SourceKey): DungeonBoostAttendanceEmbed {
        this.source = source;
        return this;
    }

    withTotalPot(totalPot: number): DungeonBoostAttendanceEmbed {
        this.totalPot = totalPot;
        return this;
    }

    withNotes(notes: string): DungeonBoostAttendanceEmbed {
        this.notes = notes;
        return this;
    }

    generate(): MessageEmbed {
        return new MessageEmbed()
            .setTitle('Mythic Plus Attendance')
            .setDescription(`${EmojiReaction.TANK} <@${this.tankId}>
${EmojiReaction.HEALER} <@${this.healerId}>
${EmojiReaction.DPS} <@${this.dpsOneId}>
${EmojiReaction.DPS} <@${this.dpsTwoId}>

${EmojiReaction.ADVERTISER} <@${this.advertiserId}>`)
            .setFields([
                { name: 'Key Level', value: `${EmojiReaction.KEYSTONE} ${this.runs}x+${this.level}`, inline: true },
                { name: 'Dungeon', value: Dungeon[this.dungeon].label, inline: true },
                { name: 'Timed', value: this.isTimed ? 'Yes' : 'No', inline: true },
                {
                    name: 'Armor Stack',
                    value: this.stacks.length > 0 ? this.stacks.map(item => Stack[item].label).join(', ') : 'Any',
                    inline: true
                },
                { name: 'Source', value: Source[this.source].label, inline: true },
                { name: 'Total Pot', value: `${EmojiReaction.MONEY_BAG} ${this.totalPot}`, inline: true },
                {
                    name: 'Booster Cut',
                    value: `${EmojiReaction.MONEY_BAG} ${DungeonBoosterUtils.getBoosterPot(this.totalPot)}`,
                    inline: true
                },
                { name: 'Notes', value: this.notes || '\u200b' }
            ])
            .setFooter({ text: `Boost ID: ${this.boostId}` });
    }
}