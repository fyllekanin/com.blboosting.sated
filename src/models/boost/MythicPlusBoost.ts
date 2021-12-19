import { ITeamsQueue } from './../../interface/teams.interface';
import { IMythicPlus } from './../../interface/mythicplus.interface';
import { Payments } from './../../interface/payments.interface';
import Emojis from '../../common/constants/emojis.enum';
import { Roles } from '../../common/constants/guildroles.constants';
import * as utils from '../../common/utils/utils';
import * as thresholds from '../../JSON/thresholds.json';
import numeral from 'numeral';
import BaseBoost from './BaseBoost';
import {
  GuildMember,
  Snowflake,
  MessageEmbed,
  MessageEmbedOptions,
  Role,
  VoiceChannel,
} from 'discord.js';
import Keys from '../../interface/keys.interface';
import { ITeams } from '../../interface/teams.interface';
import { IBoosterRoles } from '../../common/enums/boosterRole.enum';

class MythicPlusBoost extends BaseBoost {
  public tank: GuildMember | null = null;
  public healer: GuildMember | null = null;
  public dps1: GuildMember | null = null;
  public dps2: GuildMember | null = null;
  public keyholder: GuildMember | null = null;

  public tankQueue: GuildMember[] = [];
  public healerQueue: GuildMember[] = [];
  public dpsQueue: GuildMember[] = [];
  public keyholderQueue: GuildMember[] = [];

  public armorStack: Snowflake[] = [];
  public armorStackName: string[] = [];
  public keys: Keys[] = [];
  public keyLevel: Array<string | number> = [];
  public amountKeys: number;
  public lowestSignableRoleThreshold: number;
  public timed: boolean;
  public selfplay: boolean;
  public inTime: boolean;

  public voiceCode?: string;
  public voiceChannel?: VoiceChannel;

  public isTeamClaimed: boolean = false;
  public teamClaim: ITeams = {};
  public teamClaimQueue: ITeamsQueue[] = [];
  // Team name without spaces
  public teamName: string;
  // Team name
  public teamNameOriginal: string;
  // Team role class
  public teamNameOriginalRole: Role;

  public timeout: NodeJS.Timeout | null = null;

  createEmbed(): MessageEmbed {
    const template: MessageEmbedOptions = {
      title: 'Mythic Plus Boost',
      color: this.currentColor,
      fields: [
        {
          name: 'Boosters',
          value: this.getBoosterString(),
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: 'Armor Stack',
          value: this.armorStackName.join('\n'),
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false,
        },
        {
          name: 'Keystone Level',
          value: this.keys.map((key: Keys) => key.level).join('\n'),
          inline: true,
        },
        {
          name: 'Keystone',
          value: this.keys.map((key: Keys) => key.dungeon).join('\n'),
          inline: true,
        },
        {
          name: 'Timed',
          value: this.keys
            .map((key: Keys) => (key.timed ? 'Yes' : 'No'))
            .join('\n'),
          inline: true,
        },
        {
          name: 'Booster Pot',
          value: `<:gold:${Emojis.gold}>${numeral(
            this.boosterPot.toString()
          ).format('0,0')}`,
          inline: true,
        },
        {
          name: 'Total Pot',
          value: `<:gold:${Emojis.gold}>${numeral(
            this.totalPot.toString()
          ).format('0,0')}`,
          inline: true,
        },
        {
          name: 'Source',
          value: this.source,
          inline: true,
        },
        {
          name: 'Server Payment(s)',
          value:
            this.payments.length > 4
              ? this.payments
                  .map((payment: Payments) => payment.realm)
                  .slice(0, 4)
                  .join(',\n') + `,\n...`
              : this.payments
                  .map((payment: Payments) => payment.realm)
                  .join(',\n'),
          inline: true,
        },
        {
          name: 'Advertiser',
          value: this.advertiser.toString(),
          inline: true,
        },
        this.isTrial && {
          name: 'Collector',
          value: this.collector
            ? this.collector.toString()
            : `Waiting for <@&${Roles.Collector}>`,
          inline: true,
        },
      ],
    };
    return new MessageEmbed(template);
  }

  getBoosterString(): string {
    const tankOrTeambooster = this.isTeamClaimed
      ? `${this.teamClaim[this.teamName]}\n${utils.getUserMember(
          this.message.guild,
          this.teamClaim[this.teamName][0]
        )}`
      : `<:TANK:${Emojis.tank}> ${this.tank}`;
    const healerOrTeambooster = this.isTeamClaimed
      ? `\n${utils.getUserMember(
          this.message.guild,
          this.teamClaim[this.teamName][1]
        )}`
      : `\n<:HEALER:${Emojis.healer}> ${this.healer}`;
    const dps1OrTeambooster = this.isTeamClaimed
      ? `\n${utils.getUserMember(
          this.message.guild,
          this.teamClaim[this.teamName][2]
        )}`
      : `\n<:dps:${Emojis.dps}> ${this.dps1}`;
    const dps2OrTeambooster = this.isTeamClaimed
      ? `\n${utils.getUserMember(
          this.message.guild,
          this.teamClaim[this.teamName][3]
        )}`
      : `\n<:dps:${Emojis.dps}> ${this.dps2}`;

    let boosterString = `
${tankOrTeambooster}
${healerOrTeambooster}
${dps1OrTeambooster}
${dps2OrTeambooster}`;

    if (
      !this.isTeamClaimed &&
      !this.keys.map((key: Keys) => key.dungeon.toUpperCase()).includes('ANY')
    ) {
      boosterString += `\n\n<:keystone:${Emojis.keystone}> ${this.keyholder}`;
    }

    return boosterString;
  }

  setBoosterCut(): void {
    this.boosterPot = (this.totalPot * 0.7) / 4;
  }

  throttleEdit(): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      await this.message.edit({ embeds: [this.createEmbed()] });
    }, 2000);
  }

  validateUniqueSign(userToValidate: GuildMember) {
    return [this.tank, this.healer, this.dps1, this.dps2].every(
      (booster: GuildMember) => userToValidate.id !== booster.id
    );
  }

  // Given: string || number

  // Should: Find the highest key level taking "timed" into account

  // Returns: The found key level

  getHighestKeylevel(): string | number {
    const findKey = (prev: Keys, curr: Keys) =>
      prev && prev.level > curr.level ? prev : curr;
    return this.keys.some((key: Keys) => key.timed)
      ? this.keys.filter((key: Keys) => key.timed).reduce(findKey, null).level
      : this.keys.reduce(findKey, null).level;
  }

  getOneRoleLower(role: IBoosterRoles): string {
    switch (role) {
      case 'Elite':
        return 'High';
      case 'High':
        return 'Mid';
      case 'Mid':
        return 'Low';
      default:
        return 'Low';
    }
  }

  assignSelfplay(data: IMythicPlus): void {
    switch (data.advertiser.role) {
      case 'Tank':
        this.tankQueue.push(this.advertiser);
        if (this.tank) return;
        this.tank = this.advertiser;
        break;
      case 'Healer':
        this.healerQueue.push(this.advertiser);
        if (this.healer) return;
        this.healer = this.advertiser;
        break;
      case 'DPS':
        this.dpsQueue.push(this.advertiser);
        if (!this.dps1) {
          this.dps1 = this.advertiser;
        } else if (!this.dps2) {
          this.dps2 = this.advertiser;
        }
        break;
      default:
        throw new Error('Role not defined');
    }
  }

  assignBooster(key: Keys): void {
    const booster = this.guild.members.cache.get(key.booster.boosterId);

    const allowedEnum: IBoosterRoles = this.getAllowedRoleEnum(
      this.lowestSignableRoleThreshold
    );
    const allowedRole: Snowflake = Roles[`${allowedEnum} Key Booster`];
    const isAllowed = booster.roles.cache.has(allowedRole);

    if (!isAllowed)
      throw new Error(
        `Booster ${booster} is not permitted to boost ${this.lowestSignableRoleThreshold} or above`
      );

    switch (key.booster.role) {
      case 'Tank':
        this.tankQueue.push(booster);

        if (
          [this.tank, this.healer, this.dps1, this.dps2].some(
            (user) => user === booster
          )
        )
          break;

        this.tank = booster;
        break;
      case 'Healer':
        this.healerQueue.push(booster);

        if (
          [this.tank, this.healer, this.dps1, this.dps2].some(
            (user) => user === booster
          )
        )
          break;

        this.healer = booster;
        break;
      case 'DPS':
        this.dpsQueue.push(booster);

        if (
          [this.tank, this.healer, this.dps1, this.dps2].some(
            (user) => user === booster
          )
        )
          break;

        if (!this.dps1) {
          this.dps1 = booster;
          break;
        } else if (!this.dps2) {
          this.dps2 = booster;
          break;
        } else break;
      default:
        throw new Error('Role not defined');
    }
    if (key.dungeon.toLowerCase() !== 'any' && !this.keyholder) {
      this.keyholder = booster;
      this.keyholderQueue.push(booster);
    }
  }

  /**
   *
   * @param {number | string} threshold Keylevel to check against thresholds
   * @returns {number} Current threshold set to determine boosters eligable to sign
   */
  getCurrentThreshold(threshold: number | string): number {
    const isTimed = this.timed ? 'Timed' : 'Untimed';

    if (
      typeof threshold === 'string' &&
      (threshold.toUpperCase() === 'MYTHIC' ||
        threshold.toUpperCase() === 'HARD_MODE')
    ) {
      return thresholds[`${isTimed}_HighKeyBooster`];
    }

    if (/[0-9]+/.test(threshold.toString())) {
      switch (true) {
        case threshold <= thresholds[`${isTimed}_LowKeyBooster`]:
          return thresholds[`${isTimed}_LowKeyBooster`];

        case threshold <= thresholds[`${isTimed}_MidKeyBooster`] &&
          threshold > thresholds[`${isTimed}_LowKeyBooster`]:
          return thresholds[`${isTimed}_MidKeyBooster`];

        case threshold <= thresholds[`${isTimed}_HighKeyBooster`] &&
          threshold > thresholds[`${isTimed}_MidKeyBooster`]:
          return thresholds[`${isTimed}_HighKeyBooster`];

        case threshold > thresholds[`${isTimed}_HighKeyBooster`]:
          return thresholds[`${isTimed}_EliteKeyBooster`];
      }
    }
  }

  /**
   *
   * @param {number | string} threshold Keylevel to check against thresholds
   * @returns {string} Current eligable booster role enum
   */
  getAllowedRoleEnum(threshold: number | string): IBoosterRoles {
    const isTimed = this.timed ? 'Timed' : 'Untimed';

    if (
      typeof threshold === 'string' &&
      (threshold.toUpperCase() === 'MYTHIC' ||
        threshold.toUpperCase() === 'HARD_MODE')
    ) {
      return IBoosterRoles.Mid;
    }

    if (/[0-9]+/.test(threshold.toString())) {
      switch (true) {
        case threshold <= thresholds[`${isTimed}_LowKeyBooster`]:
          return IBoosterRoles.Low;

        case threshold <= thresholds[`${isTimed}_MidKeyBooster`] &&
          threshold > thresholds[`${isTimed}_LowKeyBooster`]:
          return IBoosterRoles.Mid;

        case threshold <= thresholds[`${isTimed}_HighKeyBooster`] &&
          threshold > thresholds[`${isTimed}_MidKeyBooster`]:
          return IBoosterRoles.High;

        case threshold > thresholds[`${isTimed}_HighKeyBooster`]:
          return IBoosterRoles.Elite;
      }
    }
  }

  async getRolesToPing(): Promise<string> {
    const armorStackTags = [];
    const roleRank = <IBoosterRoles>(
      this.getAllowedRoleEnum(this.getHighestKeylevel())
    );

    if (
      !this.armorStackName.some((role) =>
        [
          'PLATE',
          'LEATHER',
          'MONK',
          'DRUID',
          'DEMON HUNTER',
          'PALADIN',
          'DEATH KNIGHT',
          'WARRIOR',
          'ANY',
        ].includes(role.toUpperCase())
      )
    ) {
      armorStackTags.push(`<@&${Roles[`${roleRank} Keys Tank`]}>`);
    }
    if (
      !this.armorStackName.some((role) =>
        [
          'PLATE',
          'LEATHER',
          'CLOTH',
          'MAIL',
          'DRUID',
          'MONK',
          'PALADIN',
          'PRIEST',
          'SHAMAN',
          'ANY',
        ].includes(role.toUpperCase())
      )
    ) {
      armorStackTags.push(`<@&${Roles[`${roleRank} Keys Healer`]}>`);
    }

    for (let stack of this.armorStackName) {
      switch (stack.toUpperCase()) {
        case 'ANY':
          armorStackTags.push(`<@&${Roles[`${roleRank} Key Booster`]}>`);
          break;
        case 'CLOTH':
          armorStackTags.push(`<@&${Roles.Cloth}>`);
          break;
        case 'LEATHER':
          armorStackTags.push(`<@&${Roles.Leather}>`);
          break;
        case 'MAIL':
          armorStackTags.push(`<@&${Roles.Mail}>`);
          break;
        case 'PLATE':
          armorStackTags.push(`<@&${Roles.Plate}>`);
          break;
        case 'MAGE':
          armorStackTags.push(`<@&${Roles['Mage']}>`);
          break;
        case 'PRIEST':
          armorStackTags.push(`<@&${Roles['Priest']}>`);
          break;
        case 'WARLOCK':
          armorStackTags.push(`<@&${Roles['Warlock']}>`);
          break;
        case 'DEMON HUNTER':
          armorStackTags.push(`<@&${Roles['Demon Hunter']}>`);
          break;
        case 'DRUID':
          armorStackTags.push(`<@&${Roles['Druid']}>`);
          break;
        case 'MONK':
          armorStackTags.push(`<@&${Roles['Monk']}>`);
          break;
        case 'ROGUE':
          armorStackTags.push(`<@&${Roles['Rogue']}>`);
          break;
        case 'HUNTER':
          armorStackTags.push(`<@&${Roles['Hunter']}>`);
          break;
        case 'SHAMAN':
          armorStackTags.push(`<@&${Roles['Shaman']}>`);
          break;
        case 'DEATH KNIGHT':
          armorStackTags.push(`<@&${Roles['Death Knight']}>`);
          break;
        case 'PALADIN':
          armorStackTags.push(`<@&${Roles['Paladin']}>`);
          break;
        case 'WARRIOR':
          armorStackTags.push(`<@&${Roles['Warrior']}>`);
          break;
      }
    }

    return [...new Set(armorStackTags)].join(' ');
  }

  isTankEligable(
    memberRoles: Array<string>,
    hasTankRole: boolean,
    armorStacks: Array<string>,
    classStacks: Array<string>
  ) {
    const tankableClasses = [
      'Monk',
      'Druid',
      'Demon Hunter',
      'Paladin',
      'Warrior',
      'Death Knight',
    ];
    const tankableArmors = ['Leather', 'Plate'];

    const pickedTankableClassStacks = classStacks.filter((stack: string) =>
      tankableClasses.includes(stack)
    );
    const pickedTankableArmorStacks = armorStacks.filter((stack: string) =>
      tankableArmors.includes(stack)
    );

    const isAnyTankStack =
      [...armorStacks, ...classStacks].filter((stack) =>
        [...tankableArmors, ...tankableClasses].includes(stack)
      ).length === 0;

    const isAllowedToTankSpecific =
      memberRoles.some((role) =>
        [...pickedTankableClassStacks, ...pickedTankableArmorStacks].includes(
          role
        )
      ) && hasTankRole;
    const isAllowedToTankAny = isAnyTankStack && hasTankRole;

    return isAllowedToTankSpecific || isAllowedToTankAny;
  }
  isHealerEligable(
    memberRoles: Array<string>,
    hasHealerRole: boolean,
    armorStacks: Array<string>,
    classStacks: Array<string>
  ) {
    const healableClasses = ['Druid', 'Monk', 'Paladin', 'Priest', 'Shaman'];
    const healableArmors = ['Cloth', 'Leather', 'Mail', 'Plate'];

    const pickedHealableClassStacks = classStacks.filter((stack: string) =>
      healableClasses.includes(stack)
    );
    const pickedHealableArmorStacks = armorStacks.filter((stack: string) =>
      healableArmors.includes(stack)
    );

    const isAnyHealerStack =
      [...armorStacks, ...classStacks].filter((stack) =>
        [...healableArmors, ...healableClasses].includes(stack)
      ).length === 0;

    const isAllowedToHealSpecific =
      memberRoles.some((role) =>
        [...pickedHealableClassStacks, ...pickedHealableArmorStacks].includes(
          role
        )
      ) && hasHealerRole;
    const isAllowedToHealAny = isAnyHealerStack && hasHealerRole;

    return isAllowedToHealSpecific || isAllowedToHealAny;
  }
  isDPSEligable(
    memberRoles: Array<string>,
    hasDPSRole: boolean,
    armorStacks: Array<string>,
    classStacks: Array<string>
  ) {
    const dpsAbleClasses = [
      'Death Knight',
      'Druid',
      'Demon Hunter',
      'Hunter',
      'Mage',
      'Monk',
      'Paladin',
      'Priest',
      'Rogue',
      'Shaman',
      'Warlock',
      'Warrior',
    ];
    const dpsAbleArmors = ['Cloth', 'Leather', 'Mail', 'Plate'];

    const pickedDPSableClassStacks = classStacks.filter((stack: string) =>
      dpsAbleClasses.includes(stack)
    );
    const pickedDPSableArmorStacks = armorStacks.filter((stack: string) =>
      dpsAbleArmors.includes(stack)
    );

    const isAnyDPSStack =
      [...armorStacks, ...classStacks].filter((stack) =>
        [...dpsAbleArmors, ...dpsAbleClasses].includes(stack)
      ).length === 0;

    const isAllowedToDPSSpecific =
      memberRoles.some((role) =>
        [...pickedDPSableClassStacks, ...pickedDPSableArmorStacks].includes(
          role
        )
      ) && hasDPSRole;
    const isAllowedToDPSAny = isAnyDPSStack && hasDPSRole;

    return isAllowedToDPSSpecific || isAllowedToDPSAny;
  }
}

export default MythicPlusBoost;
