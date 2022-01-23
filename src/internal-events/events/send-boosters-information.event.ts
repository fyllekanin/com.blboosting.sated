import { InternalEventInterface } from '../internal-event.interface';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { Client } from 'discord.js';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { ServiceStartedEmbed } from '../../embeds/service-started.embed';
import { DungeonBoosterUtils } from '../../utils/dungeon-booster.utils';

export class SendBoostersInformationEvent implements InternalEventInterface {
    private readonly boostsRepository = new BoostsRepository();
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(channelId: string): Promise<void> {
        const entity = await this.boostsRepository.getBoostForChannel(channelId);
        if (!this.isApplicable(entity)) {
            return;
        }

        const boosterIds = [entity.boosters.tank, entity.boosters.healer, entity.boosters.dpsOne, entity.boosters.dpsTwo];
        const totalPot = entity.payments.reduce((prev, curr) => prev + curr.amount, 0)
        for (const boosterId of boosterIds) {
            if (boosterId !== '166322953850454016') {
                continue;
            }
            const booster = await this.client.users.fetch(boosterId);
            booster.send({
                embeds: [
                    new ServiceStartedEmbed()
                        .withTitle('Mythic Plus Boost')
                        .withBoosterId(boosterId)
                        .withBoostId(entity.channelId)
                        .withAdvertiserId(entity.advertiserId)
                        .withContactCharacter(entity.contact.name)
                        .withContactRealm(entity.contact.realm)
                        .withCut(DungeonBoosterUtils.getBoosterPot(totalPot))
                        .generate()
                ]
            })
        }
    }

    private isApplicable(entity: BoostEntity): boolean {
        return entity.boosters.tank &&
            entity.boosters.healer &&
            entity.boosters.dpsOne &&
            entity.boosters.dpsTwo &&
            entity.status.isStarted &&
            entity.status.isCollected &&
            !entity.status.isCompleted;
    }
}