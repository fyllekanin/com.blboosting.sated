import { DungeonBoostAttendanceEmbed } from '../../embeds/dungeon-boost-attendance.embed';
import { Dungeon } from '../../constants/dungeon.enum';
import { Stack } from '../../constants/stack.enum';
import { Source } from '../../constants/source.enum';
import { EmojiReaction } from '../../constants/emoji.enum';

describe('DungeonBoostAttendanceEmbed', () => {
    const defaultBuilder = new DungeonBoostAttendanceEmbed()
        .withTankId('tankId')
        .withHealerId('healerId')
        .withDpsOneId('dpsOneId')
        .withDpsTwoId('dpsTwoId')
        .withAdvertiserId('advertiserId')
        .withDungeon(Dungeon.DOS.value)
        .withLevel(15)
        .withIsTimed(true)
        .withRuns(2)
        .withStacks([Stack.CLOTH.value])
        .withSource(Source.TICKET.value)
        .withTotalPot(100000)
        .withBoostId('boostId')
        .withNotes('notes');

    it('should generate correctly', () => {
        // When
        const result = defaultBuilder.generate();

        // Then
        expect(result.description).toContain('<@tankId>');
        expect(result.description).toContain('<@healerId>');
        expect(result.description).toContain('<@dpsOneId>');
        expect(result.description).toContain('<@dpsTwoId>');
        expect(result.footer.text).toEqual('Boost ID: boostId');

        expect(result.fields.find(item => item.name === 'Key Level').value).toEqual(`${EmojiReaction.KEYSTONE} 2x+15`);
        expect(result.fields.find(item => item.name === 'Dungeon').value).toEqual(Dungeon.DOS.label);
        expect(result.fields.find(item => item.name === 'Timed').value).toEqual('Yes');
        expect(result.fields.find(item => item.name === 'Armor Stack').value).toEqual('Cloth');
        expect(result.fields.find(item => item.name === 'Source').value).toEqual(Source.TICKET.label);
        expect(result.fields.find(item => item.name === 'Total Pot').value).toEqual(`${EmojiReaction.MONEY_BAG} 100000`);
        expect(result.fields.find(item => item.name === 'Booster Cut').value).toEqual(`${EmojiReaction.MONEY_BAG} 17500`);
        expect(result.fields.find(item => item.name === 'Notes').value).toEqual('notes');
    });

    it('should let notes be empty if non set', () => {
        // When
        const result = defaultBuilder
            .withNotes(null)
            .generate();

        // Then
        expect(result.fields.find(item => item.name === 'Notes').value).toEqual('\u200b');
    });

    it('should set Timed to yes if true', () => {
        // When
        const result = defaultBuilder
            .withIsTimed(true)
            .generate();

        // Then
        expect(result.fields.find(item => item.name === 'Timed').value).toEqual('Yes');
    });

    it('should set Timed to no if false', () => {
        // When
        const result = defaultBuilder
            .withIsTimed(false)
            .generate();

        // Then
        expect(result.fields.find(item => item.name === 'Timed').value).toEqual('No');
    });
});