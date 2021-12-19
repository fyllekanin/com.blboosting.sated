import { IBoosterSlots } from './../common/enums/boosterRole.enum';
import Dungeons from '../common/enums/dungeons.enum';

interface IKeys {
  dungeon: Dungeons;
  level: string | number;
  timed: boolean;
  booster: Booster | null;
}

export interface Booster {
  boosterId: string;
  role: IBoosterSlots;
}

export default IKeys;
