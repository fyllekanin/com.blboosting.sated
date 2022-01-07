import axios from 'axios';
import { CheckPvpCharacter } from '../interfaces/check-pvp.interface';

export class CheckPvpService {
    private static CACHE: Map<string, { expiresAt: number, value: CheckPvpCharacter }> = new Map();

    static async getCharacter(region: string, realm: string, name: string): Promise<CheckPvpCharacter> {
        const cacheKey = `${region.toLowerCase()}-${realm.toLowerCase()}-${name.toLowerCase()}`;
        const cacheItem = this.CACHE.get(cacheKey);
        if (cacheItem && cacheItem.expiresAt > new Date().getTime()) {
            return cacheItem.value;
        }
        const result = await axios.get(`https://srv1.api.check-pvp.fr/v1/characters/${region}/${realm}/${name}`)
            .catch(e => {
                console.log(`error: ${e}`);
                return null;
            });
        const value = result.data as CheckPvpCharacter;
        this.CACHE.set(cacheKey, { expiresAt: new Date().getTime() + 300000, value: value });
        return value;
    }
}