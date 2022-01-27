import { CollectorEmbed } from '../../embeds/collector.embed';
import { Faction } from '../../constants/faction.enum';

describe('CollectorEmbed', () => {

    it('should generate correctly', () => {
        // When
        const result = new CollectorEmbed()
            .withBoostId('boostId')
            .withAdvertiserId('advertiserId')
            .withCollectorId('collectorId')
            .withPayments([{ realm: 'realm', faction: Faction.HORDE.value, amount: 100000 }])
            .generate();

        // Then
        expect(result.fields.find(item => item.name === 'Advertiser').value).toEqual('<@advertiserId>');
        expect(result.fields.find(item => item.name === 'Channel').value).toEqual('<#boostId>');
        expect(result.fields.find(item => item.name === 'Boost ID').value).toEqual('boostId');
        expect(result.fields.find(item => item.name === 'Collector').value).toEqual('<@collectorId>');
        expect(result.fields.find(item => item.name === 'Realm').value).toEqual('realm');
        expect(result.fields.find(item => item.name === 'Faction').value).toEqual(Faction.HORDE.label);
        expect(result.fields.find(item => item.name === 'Amount').value).toEqual('100000');
    });

    it('should not include collector', () => {
        // When
        const result = new CollectorEmbed()
            .withBoostId('boostId')
            .withAdvertiserId('advertiserId')
            .withPayments([{ realm: 'realm', faction: Faction.HORDE.value, amount: 100000 }])
            .generate();

        // Then
        expect(result.fields.find(item => item.name === 'Collector').value).toEqual('\u200b');
    });

    it('should not have name field for 2nd payment', () => {
        // When
        const result = new CollectorEmbed()
            .withBoostId('boostId')
            .withAdvertiserId('advertiserId')
            .withCollectorId('collectorId')
            .withPayments([
                { realm: 'realm', faction: Faction.HORDE.value, amount: 100000 },
                { realm: 'realm', faction: Faction.HORDE.value, amount: 100000 }
            ])
            .generate();

        // Then
        const emptyHeaders = result.fields.filter(item => item.name === '\u200b');
        expect(emptyHeaders.find(item => item.value === 'realm')).not.toBeNull();
        expect(emptyHeaders.find(item => item.value === Faction.HORDE.label)).not.toBeNull();
        expect(emptyHeaders.find(item => item.value === '100000')).not.toBeNull();
    });
});
