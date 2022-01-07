import { BaseEntity } from './base.entity';
import { Region } from '../../constants/region.enum';

export enum ApplicationType {
    MYTHIC_PLUS = 'mythic-plus',
    PVP = 'pvp',
    RAID = 'raid'
}

export interface ApplicationEntity extends BaseEntity {
    type: ApplicationType;
    applicantId: string;
    managerId: string;
    isAccepted: boolean;
    character: {
        region: Region;
        name: string;
        realm: string;
    };
}