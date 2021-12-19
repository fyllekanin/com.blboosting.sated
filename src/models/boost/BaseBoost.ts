import {
  ColorResolvable,
  DateResolvable,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  HexColorString,
  Message,
  MessageEmbed,
} from 'discord.js';
import Sources from '../../common/enums/sources.enum';

class BaseBoost {
  public boostId: string | null;
  public guild: Guild;

  public advertiser: GuildMember;
  public isTrial: boolean;
  public collector: GuildMember | null;
  public onTheWay: GuildMember | string;

  public message: Message | null;
  public collectionMessage?: Message;

  public payments: Array<Object> = [];
  public totalPot: number | null;
  public boosterPot: number | null;
  public discount?: number | null;

  public note: string | null;
  public contactCharacter: string | null;
  public source: Sources | null;
  public channel: GuildTextBasedChannel | null;

  public currentColor: ColorResolvable | HexColorString;
  public readonly creatingColor: '#5a00eb';
  public readonly inProgressColor: '#ffe100';
  public readonly completeColor: '#00c940';
  public readonly redColor = '#ff0000';

  public collected?: boolean;
  public cancelled: boolean;
  public completed: boolean;

  public date: DateResolvable | Date | string | null;
  public sheetRow: string | null;
  public successful: string | null;

  cancelBoost(): MessageEmbed {
    return new MessageEmbed().setDescription('Boost Cancelled');
  }

  /**
   * Returns current unix timestamp Europe/London
   * @returns {Date}
   */
  getDate(): DateResolvable | Date {
    return new Date()
      .toLocaleString('en-GB', {
        timeZone: 'Europe/London',
      })
      .replace(',', '');
  }
}

export default BaseBoost;
