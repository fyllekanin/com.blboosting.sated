interface IChannelsConfig {
    ApplyMythicPlus: string;
    ApplyMythicPlusInHouse: string;
    ApplyRaid: string;
    ApplyRaidInHouse: string;
    ApplyCurve: string;
    ApplyCurveInHouse: string;
    ApplyRaider91: string;
    ApplyRaider91InHouse: string;
    ApplyAdvertiser: string;
    ApplyAdvertiserInHouse: string;
    ApplyPvp: string;
    ApplyPvpInHouse: string;
    BotStatus: string;
    ApplicationReview: string;
}

export const ChannelsConfig: IChannelsConfig = process.env.NODE_ENV === 'production' ?
    require('./channels.prod.json') : require('./channels.dev.json');