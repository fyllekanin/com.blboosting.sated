import { GuildApplicationCommandPermissionData, Snowflake } from 'discord.js';
import { Roles } from '../common/constants/guildRoles.constants';
import commands from '../JSON/slashcommands.json';

const permissions: IAuthorization = {};

for (const [name, id] of Object.entries(Roles)) {
  permissions[name] = {
    allow: {
      id: id,
      type: 'ROLE',
      permission: true,
    },
    deny: {
      id: id,
      type: 'ROLE',
      permission: false,
    },
  };
}

interface IAuthorization {
  [key: string]: RolePermissions;
}

interface RolePermissions {
  allow: PermissionProps;
  deny: PermissionProps;
}

interface PermissionProps {
  id: Snowflake;
  type: string;
  permission: boolean;
}

const fullPermissions = [
  {
    id: commands['boost'],
    permissions: [
      permissions.Director.allow,
      permissions.SeniorManagement.allow,
      permissions.Management.allow,
      permissions.Advertiser.allow,
      permissions.TrialAdvertiser.deny,
      permissions.Everyone.deny,
    ],
  },
] as GuildApplicationCommandPermissionData[];

export default fullPermissions;
