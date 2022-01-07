import { RaiderIoCharacter } from '../interfaces/raider-io.interface';
import axios from 'axios';

export class RaiderIoService {
    private static CACHE: Map<string, { expiresAt: number, value: RaiderIoCharacter }> = new Map();

    static async getCharacter(region: string, realm: string, name: string): Promise<RaiderIoCharacter> {
        const cacheKey = `${region.toLowerCase()}-${realm.toLowerCase()}-${name.toLowerCase()}`;
        const cacheItem = this.CACHE.get(cacheKey);
        if (cacheItem && cacheItem.expiresAt > new Date().getTime()) {
            return cacheItem.value;
        }
        const queryParams = [
            `name=${name}`,
            `realm=${realm}`,
            `region=${region}`,
            `fields=mythic_plus_scores_by_season:current,covenant`
        ].join('&');
        const result = await axios.get(`https://raider.io/api/v1/characters/profile?${queryParams}`);
        const value = result.data as RaiderIoCharacter;
        this.CACHE.set(cacheKey, { expiresAt: new Date().getTime() + 300000, value: value });
        return value;
    }
}