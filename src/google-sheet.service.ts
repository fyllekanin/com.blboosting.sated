import { google } from 'googleapis';
import { JWT } from 'google-auth-library/build/src/auth/jwtclient';
import { ConfigEnv } from './config.env';

export class GoogleSheetService {
    private static CLIENT: JWT;

    static async startup(): Promise<void> {
        this.CLIENT = new google.auth.JWT(
            ConfigEnv.getConfig().GOOGLE_SERVICE_ACCOUNT.client_email,
            null,
            ConfigEnv.getConfig().GOOGLE_SERVICE_ACCOUNT.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        await this.CLIENT.authorize();
    }

    static async getSheetData(tabName: string, column: string, line: number): Promise<Array<string>> {
        const values = await google.sheets('v4').spreadsheets.values.get({
            auth: this.CLIENT,
            spreadsheetId: ConfigEnv.getConfig().BOOKING_DATA_SHEET_ID,
            range: `${tabName}!${column}${line}`
        });

        return values.data?.values[0] as Array<string>;
    }
}