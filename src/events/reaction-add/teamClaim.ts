import { ITeams } from './../../interface/teams.interface';
import * as fs from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import {
  Client,
  GuildEmoji,
  GuildMember,
  GuildTextBasedChannel,
  Message,
  MessageEmbed,
  Role,
} from 'discord.js';
import utils from '../../common/utils/utils';
import {
  MAX_RUN_PER_DAY,
  RESET_HOUR,
} from '../../common/constants/boost.constants';
import boost from '../../models/maps/boost';
import MythicPlusBoost from '../../models/boost/MythicPlusBoost';

const teamClaimCooldownFilePath = path.resolve(
  __dirname,
  '../../JSON/teams-cooldown/teamclaim.json'
);

export class TeamClaim {

  public async Claim(client: Client,
    message: Message,
    channel: GuildTextBasedChannel,
    emoji: GuildEmoji,
    user: GuildMember) {
    
      const boostData: MythicPlusBoost = boost.get(message.id);
      if (!boostData) return;
    
      user = message.guild.members.cache.get(user.id);
    
      const teamNameOriginalRole: Role = utils.getUserTeamName(message, user.id);
      if (teamNameOriginalRole === undefined) {
        await utils.wrongRole(user, message, emoji);
      }
      const teamNameOriginal: string = teamNameOriginalRole.name;
      if (!teamNameOriginal) {
        await utils.wrongRole(user, message, emoji);
      }
      const teamName: string = teamNameOriginal.replace(/ /g, '');
    
      // Check eligibility
      if (!this.canTeamClaimBoost(teamName)) {
        await utils.wrongRole(user, message, emoji);
        this.notifyFailedSignupTeamClaimUser(user);
      }
    
      // eslint-disable-next-line no-prototype-builtins
    
      // If the team is not in the list, add them
      if (!boostData.teamClaim.hasOwnProperty(teamName)) {
        boostData.teamClaim[teamName] = [];
      }
    
      // If the user is not in the team queue, add them
      if (!boostData.teamClaim[teamName].includes(user.id)) {
        boostData.teamClaim[teamName].push(user.id);
      }
    
      // If the user is in the team queue
      if (boostData.teamClaim[teamName].length >= 4) {
        // If boost isn't already team claimed
        if (!boostData.isTeamClaimed) {
          boostData.isTeamClaimed = true;
          boostData.teamName = teamName;
          boostData.teamNameOriginal = teamNameOriginal;
          boostData.teamNameOriginalRole = teamNameOriginalRole;
    
          boostData.throttleEdit();
        } else if (
          // Is already team claimed
          boostData.isTeamClaimed &&
          // Not the same team
          boostData.teamName !== teamName &&
          // Team queue does not include the team
          !boostData.teamClaimQueue.some(
            (teamData) => teamData.teamName === teamName
          )
        ) {
          // Add to the queue
          boostData.teamClaimQueue.push({
            teamName,
            teamNameOriginal,
          });
        }
      }

  }

  private async canTeamClaimBoost(teamName: string): Promise<boolean> {
    let teamClaimCooldown = fs.readFileSync(teamClaimCooldownFilePath);
    teamClaimCooldown = JSON.parse(teamClaimCooldown.toString());
  
    // eslint-disable-next-line no-prototype-builtins
    if (!teamClaimCooldown.hasOwnProperty(teamName)) return true;
    if (
      teamClaimCooldown[teamClaimCooldown.indexOf(teamName)] === MAX_RUN_PER_DAY
    )
      return false;
    return true;
  };

  /**
  * Notify that they reach the CD limit and has to wait
  * @param {Message} message
  * @param {GuilMember} user
  */
  private notifyFailedSignupTeamClaimUser(user: GuildMember): void {
    const embedMessage = new MessageEmbed();
    embedMessage
      .setDescription(
        `Hello ${user},
            
            Your team can not boost through the \`TeamClaim\` option anymore today. 
            
            You can use this feature ${MAX_RUN_PER_DAY.toString()} times per day and the cool down resets at ${RESET_HOUR.toString()}am GMT 0.`
      )
    .setColor('#DD0044')
    .addField('Boost done', MAX_RUN_PER_DAY.toString(), true)
    .addField('Remaining', '0', true);
    user.send({ embeds: [embedMessage] }).catch(console.error);
  };
}

/**
 * reset the cooldown
 */
const resetTeamToCooldown = (): void => {
  fs.writeFile(teamClaimCooldownFilePath, JSON.stringify({}), (err) => {
    if (err) console.error(err);
  });
};

// ====================================================
// launch the reset each morning at 6 am
// eslint-disable-next-line no-inline-comments
schedule.scheduleJob(`0 ${RESET_HOUR} * * *`, () => {
  // 6 hours GMT+2 everyday
  console.log('Reseting teamClaim cooldown');
  resetTeamToCooldown();
});
// ====================================================
