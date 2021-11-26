import {
  GuildMember,
  GuildTextBasedChannel,
  Message,
  MessageEmbed,
} from 'discord.js';
import Sources from '../../constants/sources.enum';

class BaseBoost {
  public boostId?: string;

  public advertiser?: GuildMember | null;
  public isTrial?: boolean;
  public collector?: GuildMember | null;
  public onTheWay?: GuildMember | null;

  public message?: Message | null;

  public payments?: Array<Object>;
  public totalPot?: number | null;
  public boosterPot?: number | null;
  public discount?: number | null;

  public note?: string | null;
  public contactCharacter?: string | null;
  public source?: Sources | null;
  public channel?: GuildTextBasedChannel | null;

  public currentColor: string;
  private readonly creatingColor: string;
  private readonly inProgressColor: string;
  private readonly completeColor: string;

  public collected?: boolean;
  public cancelled?: boolean;
  public completed?: boolean;

  public date?: Date | string;
  public sheetRow?: string | null;
  public successful?: string | null;

  public constructor() {
    this.boostId = '';

    // Users
    this.advertiser = null;
    this.isTrial = false;
    this.collector = null;
    this.onTheWay = null;

    // message
    this.message = null;

    // gold variables
    this.payments = [];
    this.totalPot = null;
    this.boosterPot = null;
    this.discount = null;

    // message variables
    this.note = null;
    this.contactCharacter = null;
    this.source = null;
    this.channel = null;

    // color
    this.currentColor = this.creatingColor;
    this.creatingColor = '5a00eb';
    this.inProgressColor = 'ffe100';
    this.completeColor = '00c940';

    this.collected = false;
    this.cancelled = false;
    this.completed = false;

    this.date = null;
    this.sheetRow = null;
    this.successful = null;
  }

  cancelBoost(): MessageEmbed {
    return new MessageEmbed().setDescription('Boost Cancelled');
  }

  getOneRoleLower(role: string) {
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

  getDate() {
    return new Date()
      .toLocaleString('en-GB', {
        timeZone: 'Europe/London',
      })
      .replace(',', '');
  }
}

export default BaseBoost;
