interface IRolesConfig {
    Director: string;
    SeniorManagement: string;
    Developer: string;
    Management: string;
    EliteKeyBooster: string;
    HighKeyBooster: string;
    MidKeyBooster: string;
    LowKeyBooster: string;
    Raider: string;
    Pvp: string;
    DemonHunter: string;
    Druid: string;
    Warlock: string;
    Warrior: string;
    Rogue: string;
    Priest: string;
    DeathKnight: string;
    Paladin: string;
    Monk: string;
    Mage: string;
    Shaman: string;
    Hunter: string;
    Tank: string;
    Healer: string;
    Dps: string;
    Plate: string;
    Mail: string;
    Leather: string;
    Cloth: string;
}

export const RolesConfig: IRolesConfig = process.env.NODE_ENV === 'production' ?
    require('./roles.prod.json') : require('./roles.dev.json');