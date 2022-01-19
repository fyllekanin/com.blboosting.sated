import { StartupInterface } from './startup.interface';
import { BoostsRepository } from '../persistance/repositories/boosts.repository';
import { EventBus, INTERNAL_EVENT } from '../internal-events/event.bus';
import { CategoryChannel, Client, MessageReaction, TextChannel, User } from 'discord.js';
import { Collection } from '@discordjs/collection';
import { Snowflake } from 'discord-api-types';

export class UpdateDungeonSignupsStartup implements StartupInterface {
    private readonly boostsRepository = new BoostsRepository();

    async run(client: Client, eventBus: EventBus): Promise<Array<void>> {
        const category = await client.channels.fetch(process.env.DUNGEON_BOOST_CATEGORY) as CategoryChannel;
        const promises = category.children.map(channel => this.updateEntity(eventBus, channel as TextChannel));
        return Promise.all(promises);
    }

    private async updateEntity(eventBus: EventBus, channel: TextChannel): Promise<void> {
        const entity = await this.boostsRepository.getBoostForChannel(channel.id);
        if (entity.status.isStarted) {
            return;
        }
        const message = await channel.messages.fetch(entity.messageId);

        const keyReactions = await message.reactions.resolve('🔑');
        const tankReactions = await message.reactions.resolve('🛡️');
        const healerReactions = await message.reactions.resolve('🩹');
        const dpsReactions = await message.reactions.resolve('⚔');

        const keyUsers = (await keyReactions.users.fetch()).filter(user => !user.bot);
        const tankUsers = (await tankReactions.users.fetch()).filter(user => !user.bot);
        const healerUsers = (await healerReactions.users.fetch()).filter(user => !user.bot);
        const dpsUsers = (await dpsReactions.users.fetch()).filter(user => !user.bot);

        await this.addUsersByReaction(tankReactions, keyUsers, entity.signups.tanks);
        await this.addUsersByReaction(healerReactions, keyUsers, entity.signups.healers);
        await this.addUsersByReaction(dpsReactions, keyUsers, entity.signups.dpses);

        entity.signups.tanks.forEach(user => {
            if (tankUsers.some(tankUser => tankUser.id === user.boosterId)) {
                return;
            }

            entity.signups.tanks = entity.signups.tanks.filter(item => item.boosterId !== user.boosterId);
            if (entity.signups.tanks.every(tank => tank.boosterId !== entity.boosters.tank)) {
                entity.boosters.tank = null;
            }
        });

        entity.signups.healers.forEach(user => {
            if (healerUsers.some(healerUser => healerUser.id === user.boosterId)) {
                return;
            }

            entity.signups.healers = entity.signups.healers.filter(item => item.boosterId !== user.boosterId);
            if (entity.signups.healers.every(healer => healer.boosterId !== entity.boosters.healer)) {
                entity.boosters.healer = null;
            }
        });

        entity.signups.dpses.forEach(user => {
            if (dpsUsers.some(dpsUser => dpsUser.id === user.boosterId)) {
                return;
            }

            entity.signups.dpses = entity.signups.dpses.filter(item => item.boosterId !== user.boosterId);
            if (entity.signups.dpses.every(dps => dps.boosterId !== entity.boosters.dpsOne)) {
                entity.boosters.dpsOne = null;
            }
            if (entity.signups.dpses.every(dps => dps.boosterId !== entity.boosters.dpsTwo)) {
                entity.boosters.dpsTwo = null;
            }
        });

        if (![entity.boosters.tank, entity.boosters.healer, entity.boosters.dpsOne, entity.boosters.dpsTwo].includes(entity.boosters.keyholder)) {
            entity.boosters.keyholder = null;
        }

        await this.boostsRepository.update({ channelId: entity.channelId }, entity);
        eventBus.emit(INTERNAL_EVENT.DUNGEON_BOOST_SIGNUP_CHANGE, entity.channelId);
    }

    private async addUsersByReaction(reaction: MessageReaction, keyUsers: Collection<Snowflake, User>,
                                     signupList: Array<{ boosterId: string, haveKey: boolean, createdAt: number }>): Promise<void> {
        const users = (await reaction.users.fetch()).filter(user => !user.bot);
        users.forEach(user => {
            if (signupList.every(tank => tank.boosterId !== user.id)) {
                signupList.push({
                    boosterId: user.id,
                    createdAt: new Date().getTime(),
                    haveKey: keyUsers.some(keyUser => keyUser.id === user.id)
                });
            }
        });
    }
}