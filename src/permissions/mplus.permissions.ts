import MythicPlusBoost from '../models/boost/MythicPlusBoost';
import {
  Guild,
  OverwriteResolvable,
  PermissionOverwrites,
  Permissions,
} from 'discord.js';
import { Roles } from '../common/constants/guildroles.constants';

export = (boostMsg: MythicPlusBoost, guild: Guild): OverwriteResolvable[] => {
  return [
    {
      id: guild.id,
      deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT],
    },
    {
      id: Roles['Director'],
      allow: manager,
    },
    {
      id: Roles['Senior Management'],
      allow: manager,
    },
    {
      id: Roles['Management'],
      allow: manager,
    },
    {
      id: Roles['Elite Key Booster'],
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.CONNECT],
    },
    {
      id: Roles['High Key Booster'],
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.CONNECT],
    },
    {
      id: Roles['Mid Key Booster'],
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.CONNECT],
    },
    {
      id: Roles['Low Key Booster'],
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.CONNECT],
    },
    boostMsg?.collector?.id
      ? {
          id: boostMsg.collector.id,
          allow: boostMembers,
        }
      : null,
    boostMsg?.advertiser?.id
      ? {
          id: boostMsg.advertiser.id,
          allow: boostMembers,
        }
      : null,
    !boostMsg?.isTeamClaimed
      ? {
          id: boostMsg.tank.id,
          allow: boostMembers,
        }
      : {
          id: boostMsg?.teamClaim[boostMsg.teamName]?.[0],
          allow: boostMembers,
        },
    !boostMsg?.isTeamClaimed
      ? {
          id: boostMsg.healer.id,
          allow: boostMembers,
        }
      : {
          id: boostMsg?.teamClaim[boostMsg.teamName]?.[1],
          allow: boostMembers,
        },
    !boostMsg?.isTeamClaimed
      ? {
          id: boostMsg.dps1.id,
          allow: boostMembers,
        }
      : {
          id: boostMsg?.teamClaim[boostMsg.teamName]?.[2],
          allow: boostMembers,
        },
    !boostMsg?.isTeamClaimed
      ? {
          id: boostMsg.dps2.id,
          allow: boostMembers,
        }
      : {
          id: boostMsg?.teamClaim[boostMsg.teamName]?.[3],
          allow: boostMembers,
        },
  ].filter((item) => item != null);
};

const manager = [
  Permissions.FLAGS.CONNECT,
  Permissions.FLAGS.SPEAK,
  Permissions.FLAGS.USE_VAD,
  Permissions.FLAGS.VIEW_CHANNEL,
  Permissions.FLAGS.STREAM,
  Permissions.FLAGS.MOVE_MEMBERS,
  Permissions.FLAGS.DEAFEN_MEMBERS,
  Permissions.FLAGS.MUTE_MEMBERS,
  Permissions.FLAGS.MANAGE_CHANNELS,
];

const boostMembers = [
  Permissions.FLAGS.CONNECT,
  Permissions.FLAGS.SPEAK,
  Permissions.FLAGS.USE_VAD,
  Permissions.FLAGS.VIEW_CHANNEL,
  Permissions.FLAGS.STREAM,
];
