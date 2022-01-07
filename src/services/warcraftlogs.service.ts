import { IWarcraftlogsInterface } from '../interfaces/warcraftlogs.interface';
import axios from 'axios';

export class WarcraftlogsService {
    private static CACHE: Map<string, { expiresAt: number, value: IWarcraftlogsInterface }> = new Map();
    private static TOKEN: string;

    private static async getToken(): Promise<string> {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');

        const result = await axios.post('https://www.warcraftlogs.com/oauth/token', params, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.WARCRAFTLOGS_CLIENT_ID}:${process.env.WARCRAFTLOGS_CLIENT_SECRET}`)
                    .toString('base64')
            }
        });
        return `Bearer ${result.data.access_token}`;
    }

    static async getCharacter(id: string): Promise<IWarcraftlogsInterface> {
        const cacheItem = this.CACHE.get(id);
        if (cacheItem && cacheItem.expiresAt > new Date().getTime()) {
            return cacheItem.value;
        }
        if (!this.TOKEN) {
            this.TOKEN = await this.getToken();
        }
        const result = await axios.post('https://www.warcraftlogs.com/api/v2/client', {
            query: `
                {
                  characterData {
                    character(id: ${id}) {
                      name
                      gameData
                      zoneRankings(difficulty: 4)
                    }
                  }
                }`
        }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: this.TOKEN
            }
        });
        if (result.status === 401) {
            return this.getCharacter(id);
        }
        const value = result.data as IWarcraftlogsInterface;
        this.CACHE.set(id, { expiresAt: new Date().getTime() + 300000, value: value });
        return value;
    }
}