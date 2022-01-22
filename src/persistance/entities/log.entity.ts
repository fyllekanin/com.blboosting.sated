import { BaseEntity } from './base.entity';
import { LogAction } from '../../logging/log.actions';
import { LogType } from '../../logging/log.types';

export interface LogEntity extends BaseEntity {
    action: LogAction;
    discordId: string;
    description: string;
    type: LogType;
    contentId: string;
    messageId: string;
    printOnDiscord: boolean;
}