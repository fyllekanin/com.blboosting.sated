export interface RaiderIoCharacter {
    name: string;
    race: string;
    'class': string;
    active_spec_name: string;
    active_spec_role: string;
    gender: string;
    faction: string;
    achievement_points: number;
    honorable_kills: number;
    region: string;
    realm: string;
    last_crawled_at: string;
    thumbnail_url: string;
    covenant: {
        id: number,
        name: string;
        renown_level: number
    };
    mythic_plus_scores_by_season: Array<{
        season: string;
        scores: {
            all: number;
            dps: number;
            healer: number;
            tank: number;
        }
    }>;
}