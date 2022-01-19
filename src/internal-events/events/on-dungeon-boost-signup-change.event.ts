import { InternalEventInterface } from '../internal-event.interface';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { Client, TextChannel } from 'discord.js';
import { MythicPlusEmbed } from '../../embeds/mythic-plus.embed';
import { Role, RoleKey } from '../../constants/role.constant';

export class OnDungeonBoostSignupChangeEvent implements InternalEventInterface {
    private readonly boostsRepository = new BoostsRepository();
    private readonly client: Client;
    private throttleTimeout: any;

    constructor(client: Client) {
        this.client = client;
    }

    async run(channelId: string): Promise<void> {
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout);
        }
        this.throttleTimeout = setTimeout(this.updateBoost.bind(this, channelId), 200);
    }

    private async updateBoost(channelId: string): Promise<void> {
        const entity = await this.boostsRepository.getBoostForChannel(channelId);
        if (!entity.boosters.keyholder) this.findKeyHolder(entity);
        if (!entity.boosters.tank) this.findTank(entity);
        if (!entity.boosters.healer) this.findHealer(entity);
        if (!entity.boosters.dpsOne) this.findDps(entity, entity.boosters.dpsTwo, 1);
        if (!entity.boosters.dpsTwo) this.findDps(entity, entity.boosters.dpsOne, 2);

        const channel = await this.client.channels.fetch(channelId) as TextChannel;
        const message = await channel.messages.fetch(entity.messageId);

        const title = `Mythic Dungeon Boost - ${entity.key.runs}x-${entity.key.dungeon}-${entity.key.isTimed ? 'timed' : 'untimed'}`;
        const totalPot = entity.payments.reduce((prev, curr) => prev + curr.amount, 0);
        await this.boostsRepository.update({ channelId: entity.channelId }, entity);
        await message.edit({
            embeds: [
                new MythicPlusEmbed()
                    .withTitle(title)
                    .withBoosters(this.getBoosters(entity))
                    .withStacks(entity.stack)
                    .withKey({ dungeon: entity.key.dungeon, level: entity.key.level })
                    .withIsTimed(entity.key.isTimed)
                    .withBoosterPot((totalPot * 0.70) / 4)
                    .withTotalPot(totalPot)
                    .withSource(entity.source)
                    .withPayments(entity.payments.map(payment => ({ realm: payment.realm, faction: payment.faction })))
                    .withAdvertiserId(entity.advertiserId)
                    .generate()
            ]
        })
    }

    private getBoosters(entity: BoostEntity): Array<{ boosterId: string, isTank: boolean, isHealer: boolean, isDps: boolean }> {
        const boosters: Array<{ boosterId: string, isTank: boolean, isHealer: boolean, isDps: boolean }> = [];

        if (entity.boosters.tank) {
            boosters.push({ boosterId: entity.boosters?.tank, isTank: true, isHealer: false, isDps: false });
        }
        if (entity.boosters.healer) {
            boosters.push({ boosterId: entity.boosters?.healer, isTank: false, isHealer: true, isDps: false });
        }
        if (entity.boosters.dpsOne) {
            boosters.push({ boosterId: entity.boosters?.dpsOne, isTank: false, isHealer: false, isDps: true });
        }
        if (entity.boosters.dpsTwo) {
            boosters.push({ boosterId: entity.boosters?.dpsTwo, isTank: false, isHealer: false, isDps: true });
        }

        return boosters;
    }

    private findTank(entity: BoostEntity): void {
        let tank: { boosterId: string, createdAt: number };
        const alreadyChosen = this.getAlreadyChosenPlayers(entity);
        for (const item of entity.signups.tanks) {
            if (alreadyChosen.includes(item.boosterId)) {
                continue;
            }
            if (!tank || tank?.createdAt > item.createdAt) {
                tank = item;
            }
        }
        entity.boosters.tank = tank ? tank.boosterId : null;
    }

    private findHealer(entity: BoostEntity): void {
        let healer: { boosterId: string, createdAt: number };
        const alreadyChosen = this.getAlreadyChosenPlayers(entity);
        for (const item of entity.signups.healers) {
            if (alreadyChosen.includes(item.boosterId)) {
                continue;
            }
            if (!healer || healer?.createdAt > item.createdAt) {
                healer = item;
            }
        }
        entity.boosters.healer = healer ? healer.boosterId : null;
    }

    private findDps(entity: BoostEntity, ignoreId: string, slot: number): void {
        let dps: { boosterId: string, createdAt: number };
        const alreadyChosen = this.getAlreadyChosenPlayers(entity);
        for (const item of entity.signups.dpses) {
            if (item.boosterId === ignoreId || alreadyChosen.includes(item.boosterId)) {
                continue;
            }
            if (!dps || dps?.createdAt > item.createdAt) {
                dps = item;
            }
        }
        switch (slot) {
            case 1:
                entity.boosters.dpsOne = dps ? dps.boosterId : null;
                break;
            case 2:
                entity.boosters.dpsTwo = dps ? dps.boosterId : null;
                break;
        }
    }

    private getAlreadyChosenPlayers(entity: BoostEntity): Array<string> {
        return [entity.boosters.tank, entity.boosters.healer, entity.boosters.dpsOne, entity.boosters.dpsTwo].filter(item => item);
    }

    private findKeyHolder(entity: BoostEntity): void {
        const keyHolder = this.getKeyHolder(entity);
        entity.boosters.keyholder = keyHolder ? keyHolder.boosterId : null;
        switch (keyHolder?.role) {
            case Role.TANK.value:
                entity.boosters.tank = keyHolder.boosterId;
                break;
            case Role.HEALER.value:
                entity.boosters.healer = keyHolder.boosterId;
                break;
            case Role.DPS.value:
                if (!entity.boosters.dpsOne) {
                    entity.boosters.dpsOne = keyHolder.boosterId;
                } else {
                    entity.boosters.dpsTwo = keyHolder.boosterId;
                }
                break;
        }
    }

    private getKeyHolder(entity: BoostEntity): { role: RoleKey, boosterId: string } {
        const tankKeyHolder = this.getKeyHolderFrom(entity.signups.tanks) || {
            createdAt: Number.MAX_SAFE_INTEGER,
            boosterId: null
        };
        const healerKeyHolder = this.getKeyHolderFrom(entity.signups.healers) || {
            createdAt: Number.MAX_SAFE_INTEGER,
            boosterId: null
        };
        const dpsKeyHolder = this.getKeyHolderFrom(entity.signups.dpses) || {
            createdAt: Number.MAX_SAFE_INTEGER,
            boosterId: null
        };

        if (tankKeyHolder && tankKeyHolder.createdAt < healerKeyHolder.createdAt && tankKeyHolder.createdAt < dpsKeyHolder.createdAt) {
            return { role: Role.TANK.value, boosterId: tankKeyHolder.boosterId };
        }

        if (healerKeyHolder && healerKeyHolder.createdAt < tankKeyHolder.createdAt && healerKeyHolder.createdAt < dpsKeyHolder.createdAt) {
            return { role: Role.HEALER.value, boosterId: healerKeyHolder.boosterId };
        }

        if (dpsKeyHolder && dpsKeyHolder.createdAt < healerKeyHolder.createdAt && dpsKeyHolder.createdAt < tankKeyHolder.createdAt) {
            return { role: Role.DPS.value, boosterId: dpsKeyHolder.boosterId };
        }

        return null;
    }

    private getKeyHolderFrom(boosters: Array<{ boosterId: string, haveKey: boolean, createdAt: number }>): { boosterId: string, createdAt: number } {
        let booster: { boosterId: string, createdAt: number };
        for (const item of boosters) {
            if ((!booster && item.haveKey) || (booster?.createdAt > item.createdAt && item.haveKey)) {
                booster = item;
            }
        }
        return booster;
    }
}
