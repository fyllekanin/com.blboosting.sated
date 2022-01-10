const axios = require("axios").default;
const RaidBooster = require('../../models/entity/raidBooster')

module.exports = async (client, message, channel, emoji, user) => {
    //TODO - check permissions
    //TODO - don't allow other people to react to someone elses embed

    //create object from their rio link (https://raider.io/characters/eu/kazzak/Nickles)
    let rioLink = message;
    let splitLink = rioLink.replace('https://', '');
    let charInfo = splitLink.split('/'); //[raider.io], [characters], [eu], [kazzak], [Nickles]
    //TODO - hide api key
    const options = {
        method: 'GET',
        url: 'https://raider-io.p.rapidapi.com/api/v1/characters/profile',
        params: {
          region: 'eu',
          realm: charInfo[3],
          name: charInfo[4]
        },
        headers: {
          'x-rapidapi-host': 'raider-io.p.rapidapi.com',
          'x-rapidapi-key': 'c4dbb3e893msh91a2b0b71a3227dp1ba9a4jsn6a4cacbfecb2'
        }
      };
      
      axios.request(options).then(function (response) {
        if(!response.name) return; //TODO not found - react appropriately
        
        const booster = new RaidBooster();
        booster.CharName = response.name;
        booster.CharServer = response.realm;
        booster.Class = response.Class;
        booster.DiscordUser = user;
        booster.Rio = message;
        booster.Thumbnail = response.Thumbnail;
        booster.CharEmbed = booster.createEmbed();

        //delete original message, we have enough to construct the embed
        await message.delete();
        
        //TODO send this once it has communicated with the sheet. Testable for now.
        channel.send({
            embeds: [
                booster.CharEmbed
            ]
        });


      }).catch(function (error) {
          //TODO - invalid RIO link, maybe return a "not found" embed? Or maybe delete the message and message the user that it failed.
      });
}