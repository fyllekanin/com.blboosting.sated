import { Snowflake } from 'discord.js';
import { Payments } from './payments.interface';
import { IBoosterSlots } from '../common/enums/boosterRole.enum';
import Sources from '../common/enums/sources.enum';
import Keys from './keys.interface';

export interface IMythicPlus {
  name: string;
  realm: string;
  source: Sources;
  payments: Payments[];
  paidBalance: number | null;
  discount: number | null;
  stack: string[];
  keys: Keys[];
  advertiser: IAdvertiser;
  notes: string | null;
}

interface IAdvertiser {
  advertiserId: Snowflake;
  playing: boolean;
  role: IBoosterSlots;
}
