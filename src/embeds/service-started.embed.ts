import { EmbedInterface } from './embed.interface';
import { MessageEmbed } from 'discord.js';
import { EmojiReaction } from '../constants/emoji.enum';

export class ServiceStartedEmbed implements EmbedInterface {
    private title: string;
    private boosterId: string;
    private advertiserId: string;
    private contactCharacter: string;
    private contactRealm: string;
    private boostId: string;
    private cut: number;
    private voiceChannelId: string;

    withTitle(title: string): ServiceStartedEmbed {
        this.title = title;
        return this;
    }

    withBoosterId(boosterId: string): ServiceStartedEmbed {
        this.boosterId = boosterId;
        return this;
    }

    withAdvertiserId(advertiserId: string): ServiceStartedEmbed {
        this.advertiserId = advertiserId;
        return this;
    }

    withContactCharacter(contactCharacter: string): ServiceStartedEmbed {
        this.contactCharacter = contactCharacter;
        return this;
    }

    withContactRealm(contactRealm: string): ServiceStartedEmbed {
        this.contactRealm = contactRealm;
        return this;
    }

    withBoostId(boostId: string): ServiceStartedEmbed {
        this.boostId = boostId;
        return this;
    }

    withCut(cut: number): ServiceStartedEmbed {
        this.cut = cut;
        return this;
    }

    withVoiceChannelId(voiceChannelId: string): ServiceStartedEmbed {
        this.voiceChannelId = voiceChannelId;
        return this;
    }

    generate(): MessageEmbed {
        return new MessageEmbed()
            .setTitle(this.title)
            .setColor('RED')
            .setDescription(`Good day <@${this.boosterId}>,

the boost you recently signed for is ready!
When the run is completed, make sure you let <@${this.advertiserId}> know in order for the run to be processed.

Below you will find some details regarding your run, note that it's mandatory you join the voice channel created for you and your boosting buddies.
Also, make sure you ask the client what loot spec to run and trade them ALL items.

Good luck!`)
            .addFields([
                {
                    name: 'Char to whisper',
                    value: `/w ${this.contactCharacter}-${this.contactRealm} inv`,
                    inline: true
                },
                { name: 'Boost ID', value: this.boostId, inline: true },
                { name: 'Your Cut', value: `${EmojiReaction.MONEY_BAG} ${this.cut.toLocaleString()}`, inline: true },
                { name: 'Voice Channel', value: `<#${this.voiceChannelId}>` }
            ])
    }
}