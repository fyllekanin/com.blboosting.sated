export interface IWarcraftlogsInterface {
    data: {
        characterData: {
            character: {
                name: string;
                gameData: {
                    global: {
                        realm: {
                            slug: string;
                            name: string;
                        };
                        guild: {
                            name: string;
                        };
                        race: {
                            name: string;
                        };
                        character_class: {
                            name: string;
                        };
                        covenant_progress: {
                            chosen_covenant: {
                                name: string;
                            }
                        };
                        equipped_item_level: number;
                    };
                    expansions: Array<{
                        expansion: {
                            name: string | 'Shadowlands';
                        };
                        instances: Array<{
                            instance: {
                                name: string;
                            };
                            modes: Array<{
                                difficulty: {
                                    type: 'NORMAL' | 'HEROIC' | 'MYTHIC';
                                    name: string;
                                };
                                progress: {
                                    completed_count: number;
                                    total_count: number;
                                }
                            }>
                        }>
                    }>
                };
                zoneRankings: {
                    bestPerformanceAverage: number;
                }
            }
        }
    };
}