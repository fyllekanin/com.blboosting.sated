import { InternalEventInterface } from '../internal-event.interface';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { BoostEntity } from '../../persistance/entities/boost.entity';

export class OnDungeonBoostSignupChangeEvent implements InternalEventInterface {
    private readonly boostsRepository = new BoostsRepository();
    private throttleTimeout: any;

    async run(channelId: string): Promise<void> {
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout);
        }
        this.throttleTimeout = setTimeout(this.updateBoost.bind(this, channelId), 3000);
    }

    private async updateBoost(channelId: string): Promise<void> {
        const entity = await this.boostsRepository.getBoostForChannel(channelId);
        if (!entity.boosters.keyholder) this.findKeyHolder(entity);
        if (!entity.boosters.tank) this.findTank(entity);
        if (!entity.boosters.healer) this.findHealer(entity);
        if (!entity.boosters.dpsOne) this.findDps(entity, entity.boosters.dpsTwo, 1);
        if (!entity.boosters.dpsTwo) this.findDps(entity, entity.boosters.dpsOne, 2);
        

    }

    private findTank(entity: BoostEntity): void {
        let tank: { boosterId: string, createdAt: number };
        for (const item of entity.signups.tanks) {
            if (!tank || tank?.createdAt > item.createdAt) {
                tank = item;
            }
        }
        entity.boosters.tank = tank ? tank.boosterId : null;
    }

    private findHealer(entity: BoostEntity): void {
        let healer: { boosterId: string, createdAt: number };
        for (const item of entity.signups.healers) {
            if (!healer || healer?.createdAt > item.createdAt) {
                healer = item;
            }
        }
        entity.boosters.healer = healer ? healer.boosterId : null;
    }

    private findDps(entity: BoostEntity, ignoreId: string, slot: number): void {
        let dps: { boosterId: string, createdAt: number };
        for (const item of entity.signups.healers) {
            if (item.boosterId === ignoreId) {
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

    private findKeyHolder(entity: BoostEntity): void {
        const keyHolder = this.getKeyHolder(entity);
        entity.boosters.keyholder = keyHolder ? keyHolder.boosterId : null;
        switch (keyHolder.role) {
            case 'Tank':
                entity.boosters.tank = keyHolder.boosterId;
                break;
            case 'Healer':
                entity.boosters.healer = keyHolder.boosterId;
                break;
            case 'Dps':
                if (!entity.boosters.dpsOne) {
                    entity.boosters.dpsOne = keyHolder.boosterId;
                } else {
                    entity.boosters.dpsTwo = keyHolder.boosterId;
                }
                break;
        }
    }

    private getKeyHolder(entity: BoostEntity): { role: 'Tank' | 'Healer' | 'Dps', boosterId: string } {
        const tankKeyHolder = this.getKeyHolderFrom(entity.signups.tanks);
        const healerKeyHolder = this.getKeyHolderFrom(entity.signups.healers);
        const dpsKeyHolder = this.getKeyHolderFrom(entity.signups.dpses);

        if (tankKeyHolder.createdAt < healerKeyHolder.createdAt && tankKeyHolder.createdAt < dpsKeyHolder.createdAt) {
            return { role: 'Tank', boosterId: tankKeyHolder.boosterId };
        }

        if (healerKeyHolder.createdAt < tankKeyHolder.createdAt && healerKeyHolder.createdAt < dpsKeyHolder.createdAt) {
            return { role: 'Healer', boosterId: healerKeyHolder.boosterId };
        }

        if (dpsKeyHolder.createdAt < healerKeyHolder.createdAt && dpsKeyHolder.createdAt < tankKeyHolder.createdAt) {
            return { role: 'Dps', boosterId: dpsKeyHolder.boosterId };
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
