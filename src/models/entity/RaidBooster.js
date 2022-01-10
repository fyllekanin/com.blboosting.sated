const { MessageEmbed } = require('discord.js');

class RaidBooster {
    constructor() {
        this.CharName = '';
        this.CharServer = '';
        this.Class = '';
        this.DiscordUser = null;
        this.Rio = '';
        this.Thumbnail = '';
        this.CharEmbed = null;
        this.IsBloodlusted = false;
        this.BoostId = 'FIX ME! This has not been implemented yet.';
    }

    createEmbed() {
        const embed = {
            'title': 'Mythic Dungeon Boost',
            'color': `${this.currentColor}`,
            'footer': {
                'text': `${this.BoostId}`
            },
            'fields': [
                {
                    'name': `${this.CharName} - ${this.CharServer}`,
                    'value': this.Thumbnail, //TODO I dont think this is going to work.
                    'inline': true,
                },
                {
                    //whats this?
                    'name': '\u200B',
                    'value': `\u200B`,
                    'inline': true,
                },
                {
                    'name': 'Class',
                    'value': this.Class, //TODO I dont think this is going to work.
                    'inline': true,
                },
                {
                    'name': 'User',
                    'value': this.DiscordUser, 
                    'inline': true,
                },
                {                   
                    'name': 'Raider.io',
                    'value': this.Rio,
                    'inline': true,
                }
            ]
        }
    }        
}

module.exports = RaidBooster;