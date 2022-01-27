import { BoostEntity } from '../../persistance/entities/boost.entity';
import { BoostsRepository } from '../../persistance/repositories/boosts.repository';
import { UpdateDungeonSignupsStartup } from '../../startup/update-dungeon-signups.startup';
import { Client } from 'discord.js';

describe('UpdateDungeonSignupsStartup', () => {

    describe('run', () => {

        function getRepositoryFake(entities: Array<BoostEntity>): BoostsRepository {
            return <BoostsRepository><unknown>{
                getBoostForChannel: channelId => entities.find(item => item.channelId === channelId),
                update: _item => null
            };
        }

        it('should delete the channel if no related entity found', async () => {
            // Given
            let haveDeleted = false;
            const startup = new UpdateDungeonSignupsStartup(getRepositoryFake([]));
            const child = {
                channelId: 'test',
                delete: () => haveDeleted = true
            };
            const client = <Client><unknown>{
                channels: {
                    fetch: () => ({
                        children: [child]
                    })
                }
            };

            // When
            await startup.run(client, null);

            // Then
            expect(haveDeleted).toBeTruthy();
        });

        it('it should not do anything if entity is started', async () => {
            // Given
            let haveFetchedMessage = false;
            const startup = new UpdateDungeonSignupsStartup(getRepositoryFake([
                <BoostEntity><unknown>{ id: 'test', status: { isStarted: true } }
            ]));
            const child = {
                channelId: 'test',
                messages: {
                    fetch: () => haveFetchedMessage = true
                }
            };
            const client = <Client><unknown>{
                channels: {
                    fetch: () => ({
                        children: [child]
                    })
                }
            };

            // When
            await startup.run(client, null);

            // Then
            expect(haveFetchedMessage).toBeFalsy();
        });
    });

});