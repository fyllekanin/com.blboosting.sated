/** global describe */

import { DungeonBoosterUtils } from '../../utils/dungeon-booster.utils';
import { EmojiReaction } from '../../constants/emoji.enum';
import { BoosterRole } from '../../constants/role.constant';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { Guild } from 'discord.js';
import { ConfigEnv } from '../../config.env';

describe('DungeonBoosterUtils', () => {

    describe('getRoleFromEmoji', () => {
        it('should return null if not tank, healer or dps', () => {
            // When
            const value = DungeonBoosterUtils.getRoleFromEmoji(EmojiReaction.CANCEL);

            // Then
            expect(value).toEqual(null);
        });
        it('should return TANK if emoji is tank', () => {
            // When
            const value = DungeonBoosterUtils.getRoleFromEmoji(EmojiReaction.TANK);

            // Then
            expect(value).toEqual(BoosterRole.TANK.value);
        });
        it('should return HEALER if emoji is healer', () => {
            // When
            const value = DungeonBoosterUtils.getRoleFromEmoji(EmojiReaction.HEALER);

            // Then
            expect(value).toEqual(BoosterRole.HEALER.value);
        });
        it('should return DPS if emoji is dps', () => {
            // When
            const value = DungeonBoosterUtils.getRoleFromEmoji(EmojiReaction.DPS);

            // Then
            expect(value).toEqual(BoosterRole.DPS.value);
        });
    });

    describe('getBoosters', () => {
        it('should not add any boosters if none is set', () => {
            // Given
            const entity = <BoostEntity><unknown>{
                boosters: { tank: null, healer: null, dpsOne: null, dpsTwo: null }
            };

            // When
            const result = DungeonBoosterUtils.getBoosters(entity);

            // Then
            expect(result.length).toEqual(0);
        });
        it('should add tank if tank is set', () => {
            // Given
            const entity = <BoostEntity><unknown>{
                boosters: { tank: '1', healer: null, dpsOne: null, dpsTwo: null }
            };

            // When
            const result = DungeonBoosterUtils.getBoosters(entity);

            // Then
            expect(result.length).toEqual(1);
            expect(result[0].isTank).toBeTruthy();
        });
        it('should add healer if healer is set', () => {
            // Given
            const entity = <BoostEntity><unknown>{
                boosters: { tank: null, healer: '1', dpsOne: null, dpsTwo: null }
            };

            // When
            const result = DungeonBoosterUtils.getBoosters(entity);

            // Then
            expect(result.length).toEqual(1);
            expect(result[0].isHealer).toBeTruthy();
        });
        it('should add dps if dps is set', () => {
            // Given
            const entity = <BoostEntity><unknown>{
                boosters: { tank: null, healer: null, dpsOne: '1', dpsTwo: null }
            };

            // When
            const result = DungeonBoosterUtils.getBoosters(entity);

            // Then
            expect(result.length).toEqual(1);
            expect(result[0].isDps).toBeTruthy();
        });
        it('should add all if all is set', () => {
            // Given
            const entity = <BoostEntity><unknown>{
                boosters: { tank: '1', healer: '2', dpsOne: '3', dpsTwo: '4' }
            };

            // When
            const result = DungeonBoosterUtils.getBoosters(entity);

            // Then
            expect(result.length).toEqual(4);
            expect(result.some(item => item.isTank)).toBeTruthy();
            expect(result.some(item => item.isHealer)).toBeTruthy();
            expect(result.some(item => item.isDps)).toBeTruthy();
        });
    });

    describe('isAllowedToSignWithStack', () => {
        it('should return true if no stacks provided', async () => {
            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(null, [], null, null);

            // Then
            expect(result).toBeTruthy();
        });
        it('should return true if non of the provided stacks can be tank and user is tank', async () => {
            // Given
            const stacks = [ConfigEnv.getConfig().DISCORD_ROLE_MAIL];

            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(null, stacks, null, BoosterRole.TANK.value);

            // Then
            expect(result).toBeTruthy();
        });
        it('should return true if non of the provided stacks can be healer and user is healer', async () => {
            // Given
            const stacks = [ConfigEnv.getConfig().DISCORD_ROLE_MAGE];

            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(null, stacks, null, BoosterRole.HEALER.value);

            // Then
            expect(result).toBeTruthy();
        });
        it('should return true if user got one of the provided stacks', async () => {
            // Given
            const userId = '1';
            const guild = <Guild><unknown>{ roles: { fetch: async () => ({ members: [{ id: userId }] }) } };
            const stacks = [ConfigEnv.getConfig().DISCORD_ROLE_MAGE];
            const role = BoosterRole.DPS.value;

            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(guild, stacks, userId, role);

            // Then
            expect(result).toBeTruthy();
        });
        it('should return false if user got non of the provided stacks and any of the stacks can be tank', async () => {
            // Given
            const userId = '1';
            const guild = <Guild><unknown>{ roles: { fetch: async () => ({ members: [] }) } };
            const stacks = [ConfigEnv.getConfig().DISCORD_ROLE_PLATE];
            const role = BoosterRole.TANK.value;

            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(guild, stacks, userId, role);

            // Then
            expect(result).toBeFalsy();
        });
        it('should return false if user got non of the provided stacks and any of the stacks can be healer', async () => {
            // Given
            const userId = '1';
            const guild = <Guild><unknown>{ roles: { fetch: async () => ({ members: [] }) } };
            const stacks = [ConfigEnv.getConfig().DISCORD_ROLE_PLATE];
            const role = BoosterRole.HEALER.value;

            // When
            const result = await DungeonBoosterUtils.isAllowedToSignWithStack(guild, stacks, userId, role);

            // Then
            expect(result).toBeFalsy();
        });
    });
});