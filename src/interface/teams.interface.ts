import { Snowflake } from 'discord.js';

export interface ITeams {
  [teamName: string]: Array<Snowflake>;
}

export interface ITeamsQueue {
  teamName: string;
  teamNameOriginal: string;
}
