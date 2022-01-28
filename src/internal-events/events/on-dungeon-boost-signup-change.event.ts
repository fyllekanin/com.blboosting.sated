import { InternalEventInterface } from '../internal-event.interface';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { BoostEntity } from '../../persistance/entities/boost.entity';
import { CategoryChannel, Client, TextChannel } from 'discord.js';
import { MythicPlusEmbed } from '../../embeds/mythic-plus.embed';
import { BoosterRole, RoleKey } from '../../constants/role.constant';
import { ConfigEnv } from '../../config.env';
import { EmojiReaction } from '../../constants/emoji.enum';
import { EventBus, INTERNAL_EVENT } from '../event.bus';
import { DungeonBoosterUtils } from '../../utils/dungeon-booster.utils';

export class OnDungeonBoostSignupChangeEvent implements InternalEventInterface {
    private readonly boostsRepository = new BoostsRepository();
    private readonly client: Client;
    private readonly eventBus: EventBus;
    private throttleTimeout: ReturnType<typeof setTimeout>;

    constructor(client: Client, eventBus: EventBus) {
        this.client = client;
        this.eventBus = eventBus;
    }

    async run(): Promise<void> {
        if (this.throttleTimeout) {
            console.log('was throttled');
            clearTimeout(this.throttleTimeout);
        }
        this.throttleTimeout = setTimeout(async () => {
            const category = await this.client.channels.fetch(ConfigEnv.getConfig().DUNGEON_BOOST_CATEGORY) as CategoryChannel;
            category.children.forEach(async (channel: TextChannel) => {
                const entity = await this.boostsRepository.getBoostForChannel(channel.id);
                const message = await channel.messages.fetch(entity.messageId);
                if (message.reactions.resolve(EmojiReaction.COMPLETE_DUNGEON) == null) {
                    this.updateBoost(entity);
                }
            });
        }, 200);
    }

    private async updateBoost(entity: BoostEntity): Promise<void> {
        const channel = await this.client.channels.fetch(entity.channelId) as TextChannel;
        const message = await channel.messages.fetch(entity.messageId);
        await this.checkIfTeamClaim(entity);

        if (!entity.boosters.teamId && (entity.createdAt + 15000) > new Date().getTime()) {
            const sleepFor = ((entity.createdAt + 15000) - new Date().getTime());
            console.log(`Sleeping for ${sleepFor}`);
            setTimeout(async () => {
                const updatedEntity = await this.boostsRepository.getBoostForChannel(entity.channelId);
                if (!updatedEntity.status.isStarted) {
                    this.run();
                }
            }, sleepFor);
            return;
        }

        if (!entity.boosters.keyholder) this.findKeyHolder(entity);
        if (!entity.boosters.tank) this.findTank(entity);
        if (!entity.boosters.healer) this.findHealer(entity);
        if (!entity.boosters.dpsOne) this.findDps(entity, 1);
        if (!entity.boosters.dpsTwo) this.findDps(entity, 2);

        const title = `Mythic Dungeon Boost - ${entity.key.runs}x-${entity.key.dungeon}-${entity.key.isTimed ? 'timed' : 'untimed'}`;
        const totalPot = entity.payments.reduce((prev, curr) => prev + curr.amount, 0);
        await this.boostsRepository.update({ channelId: entity.channelId }, entity);
        message.edit({
            embeds: [
                new MythicPlusEmbed()
                    .withTitle(title)
                    .withBoosters(DungeonBoosterUtils.getBoosters(entity))
                    .withStacks(entity.stack)
                    .withKey({ dungeon: entity.key.dungeon, level: entity.key.level })
                    .withIsTimed(entity.key.isTimed)
                    .withBoosterPot(DungeonBoosterUtils.getBoosterPot(totalPot))
                    .withTotalPot(totalPot)
                    .withSource(entity.source)
                    .withPayments(entity.payments.map(payment => ({ realm: payment.realm, faction: payment.faction })))
                    .withAdvertiserId(entity.advertiserId)
                    .withNotes(entity.notes)
                    .generate()
            ]
        });

        if (entity.boosters.tank && entity.boosters.healer && entity.boosters.dpsOne && entity.boosters.dpsTwo && entity.status.isCollected) {
            this.eventBus.emit(INTERNAL_EVENT.START_DUNGEON_BOOST);
        }
    }

    private async checkIfTeamClaim(entity: BoostEntity): Promise<void> {
        const teams: { [key: string]: { tanks: Array<string>, healers: Array<string>, dpses: Array<string>, keyholder: Array<string> } } = {};
        const getTeamOrNew = teamId => {
            if (teams[teamId]) {
                return teams[teamId];
            } else {
                teams[teamId] = { tanks: [], healers: [], dpses: [], keyholder: [] };
                return teams[teamId];
            }
        }
        entity.signups.tanks.filter(item => item.teamId).forEach(item => {
            const team = getTeamOrNew(item.teamId);
            team.tanks.push(item.boosterId);
        });
        entity.signups.healers.filter(item => item.teamId).forEach(item => {
            const team = getTeamOrNew(item.teamId);
            team.healers.push(item.boosterId);
            if (item.haveKey) {
                team.keyholder.push(item.boosterId);
            }
        });
        entity.signups.dpses.filter(item => item.teamId).forEach(item => {
            const team = getTeamOrNew(item.teamId);
            team.dpses.push(item.boosterId);
            if (item.haveKey) {
                team.keyholder.push(item.boosterId);
            }
        });

        for (const teamId in teams) {
            const team = teams[teamId];
            const group: { tank?: string, healer?: string, dpsOne?: string, dpsTwo?: string, keyholder?: string } = {};
            group.tank = team.tanks[0];
            group.healer = team.healers.filter(item => item !== group.tank)[0];
            group.dpsOne = team.dpses.filter(item => item !== group.tank && item !== group.healer)[0];
            group.dpsTwo = team.dpses.filter(item => item !== group.tank && item !== group.healer && item !== group.dpsOne)[0];
            group.keyholder = team.keyholder[0];

            if (group.tank && group.healer && group.dpsOne && group.dpsTwo && group.keyholder) {
                entity.boosters.tank = group.tank;
                entity.boosters.healer = group.healer;
                entity.boosters.dpsOne = group.dpsOne;
                entity.boosters.dpsTwo = group.dpsTwo;
                entity.boosters.keyholder = group.keyholder;
                entity.boosters.teamId = teamId;
                break;
            }
        }
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

    private findDps(entity: BoostEntity, slot: number): void {
        let dps: { boosterId: string, createdAt: number };
        const alreadyChosen = this.getAlreadyChosenPlayers(entity);
        for (const item of entity.signups.dpses) {
            if (alreadyChosen.includes(item.boosterId)) {
                continue;
            }
            if (!dps || dps.createdAt > item.createdAt) {
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
            case BoosterRole.TANK.value:
                entity.boosters.tank = keyHolder.boosterId;
                break;
            case BoosterRole.HEALER.value:
                entity.boosters.healer = keyHolder.boosterId;
                break;
            case BoosterRole.DPS.value:
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
            return { role: BoosterRole.TANK.value, boosterId: tankKeyHolder.boosterId };
        }

        if (healerKeyHolder && healerKeyHolder.createdAt < tankKeyHolder.createdAt && healerKeyHolder.createdAt < dpsKeyHolder.createdAt) {
            return { role: BoosterRole.HEALER.value, boosterId: healerKeyHolder.boosterId };
        }

        if (dpsKeyHolder && dpsKeyHolder.createdAt < healerKeyHolder.createdAt && dpsKeyHolder.createdAt < tankKeyHolder.createdAt) {
            return { role: BoosterRole.DPS.value, boosterId: dpsKeyHolder.boosterId };
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
