import { Faction } from './../common/enums/faction.enum';
import { Realms } from '../common/enums/realm.enum';
import { Snowflake } from 'discord-api-types';

export interface Payments {
  amount: number;
  realm: Realms;
  faction: Faction;
  collectorId: Snowflake;
}
