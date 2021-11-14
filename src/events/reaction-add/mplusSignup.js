const emojis = require('../../JSON/emojis.json');
const roles = require('../../JSON/server-info/roles.json');
const channels = require('../../JSON/server-info/channels.json');
const dungeons = require('../../JSON/dungeons.json');
const utils = require('../../common/utils/utils');
const embeds = require('../../common/utils/embeds');
const boostMap = require('../../models/maps/boosts');
const Sheet = require('../../services/spreadsheet');
const voicePerms = require('../../permissions/mplusVoice');
const { MessageEmbed } = require('discord.js');
const thresholds = require('../../JSON/thresholds.json');
const teamClaimSignup = require('./teamClaim');

const inProgressColor = 'ffe100';
const completeColor = '00c940';

module.exports = async (client, message, channel, emoji, user) => {
    const boostMsg = boostMap.get(message.id);
    if (!boostMsg || boostMsg.completed) return console.log(`Boost ${message.id} not found`);

    user = message.guild.members.cache.get(user.id);

    const armorStacks = boostMsg.armorStackName.filter(armor => ['Mail', 'Leather', 'Plate', 'Cloth'].includes(armor));
    const classStacks = boostMsg.armorStackName.filter(armor => !['Mail', 'Leather', 'Plate', 'Cloth'].includes(armor));

    const armorStackIds = boostMsg.armorStack.filter(armor => [roles['Mail'], roles['Leather'], roles['Plate'], roles['Cloth']].includes(armor.replace(/[<&@>]/gm, '')));
    const classStackIds = boostMsg.armorStack.filter(armor => ![roles['Mail'], roles['Leather'], roles['Plate'], roles['Cloth']].includes(armor.replace(/[<&@>]/gm, '')));

    const userRoleIds = user.roles.cache.map(role => role.id);
    const hasAnyRole = userRoleIds.some(role => [...armorStackIds.map(stack => stack.replace(/[<&@>]/gm, '')), ...classStackIds.map(stack => stack.replace(/[<&@>]/gm, ''))].includes(role));

    let hasStackRole = ((armorStacks.length === 1 && armorStacks[0] === 'Any') || (classStacks.length === 1 && classStacks[0] === 'Any'))

    const booster = {
        hasTankRole: user.roles.cache.has(getTankRoleBasedOnKeyLevel(boostMsg)),
        hasHealerRole: user.roles.cache.has(getHealerRoleBasedOnKeyLevel(boostMsg)),
        hasDpsRole: user.roles.cache.has(getDpsRoleBasedOnKeyLevel(boostMsg))
    };

    const memberRoles = user.roles.cache.map(roles => roles.name);

    switch (emoji) {
        case emojis.tank:
            if (!boostMsg.isTankEligable(memberRoles, booster.hasTankRole, armorStacks, classStacks)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            if (boostMsg.tankArray.includes(user)) {
                break;
            }

            boostMsg.tankArray.push(user);
            embeds.boostLoggingEmbed(client, `${user} \`signed\` to boost \`${boostMsg.boostId}\` as a \`tank\``)

            if (boostMsg.keys.filter(key => key.dungeon.toUpperCase() !== 'ANY')?.length > 1 || boostMsg.keys.find(key => key.dungeon.toUpperCase() === 'ANY') || boostMsg.keystoneUser !== '') {
                if (boostMsg.tank === '') {
                    if (boostMsg.validateUniqueSign(user)) {
                        boostMsg.tank = user;
                    }
                }
            } else if (boostMsg.keyholderArray.includes(user)) {
                if (!boostMsg.tank) {
                    boostMsg.keystoneUser = user
                    boostMsg.tank = user
                    fillBoostAfterKeyholder(boostMsg)
                }
            }
            break;
        case emojis.healer:
            if (!boostMsg.isHealerEligable(memberRoles, booster.hasHealerRole, armorStacks, classStacks)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            if (boostMsg.healerArray.includes(user)) {
                break;
            }

            boostMsg.healerArray.push(user);
            embeds.boostLoggingEmbed(client, `${user} \`signed\` to boost \`${boostMsg.boostId}\` as a \`healer\``)

            if (boostMsg.keys.filter(key => key.dungeon.toUpperCase() !== 'ANY')?.length > 1 || boostMsg.keys.find(key => key.dungeon.toUpperCase() === 'ANY') || boostMsg.keystoneUser !== '') {
                if (boostMsg.healer === '') {
                    if (boostMsg.validateUniqueSign(user)) {
                        boostMsg.healer = user;
                    }
                }
            } else if (boostMsg.keyholderArray.includes(user) && boostMsg.keys.length === 1) {
                if (!boostMsg.healer) {
                    boostMsg.keystoneUser = user
                    boostMsg.healer = user
                    fillBoostAfterKeyholder(boostMsg)
                }
            }
            break;
        case emojis.dps:
            if (!boostMsg.isDPSEligable(memberRoles, booster.hasDpsRole, armorStacks, classStacks)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            // If user already in queue, break out of the switch
            if (boostMsg.dpsArray.includes(user)) {
                break;
            }

            boostMsg.dpsArray.push(user);
            embeds.boostLoggingEmbed(client, `${user} \`signed\` to boost \`${boostMsg.boostId}\` as a \`dps\``)

            // If the key is random or the keyholder already picked and waiting for more, check availability
            if (boostMsg.keys.filter(key => key.dungeon.toUpperCase() !== 'ANY')?.length > 1 || boostMsg.keys.find(key => key.dungeon.toUpperCase() === 'ANY') || boostMsg.keystoneUser !== '') {
                if (boostMsg.dps1 === '' || boostMsg.dps2 === '') {
                    if (boostMsg.validateUniqueSign(user)) {
                        if (boostMsg.dps1 === '') {
                            boostMsg.dps1 = user;
                        } else {
                            boostMsg.dps2 = user;
                        }
                    }
                }
                // If no keyholder and user already in keyholder queue, pick them and fill boost
            } else if (boostMsg.keyholderArray.includes(user)) {
                if (boostMsg.dps1 === '') {
                    boostMsg.keystoneUser = user
                    boostMsg.dps1 = user
                    fillBoostAfterKeyholder(boostMsg)
                } else if (boostMsg.dps2 === '') {
                    boostMsg.dps2 = user
                    fillBoostAfterKeyholder(boostMsg)
                }
            }
            break;
        case emojis.keystone:
            // Add check for stack role && tank if mail or cloth
            if (!boostMsg.keyholderArray.includes(user)) {
                boostMsg.keyholderArray.push(user);
                embeds.boostLoggingEmbed(client, `${user} \`signed\` to boost \`${boostMsg.boostId}\` as a \`keyholder\``)
            }
            if (boostMsg.keystoneUser !== '') break;

            if (boostMsg.validateUniqueSign(user)) {
                if (boostMsg.tankArray.includes(user)) {
                    boostMsg.tank = user;
                    boostMsg.keystoneUser = user;
                } else if (boostMsg.healerArray.includes(user)) {
                    boostMsg.healer = user;
                    boostMsg.keystoneUser = user;
                } else if (boostMsg.dpsArray.includes(user)) {
                    if (boostMsg.dps1 === '') {
                        boostMsg.dps1 = user;
                        boostMsg.keystoneUser = user;
                    } else if (boostMsg.dps2 === '') {
                        boostMsg.dps2 = user;
                        boostMsg.keystoneUser = user;
                    } else {
                        boostMsg.dps2 = user;
                        boostMsg.keystoneUser = user;
                    }
                }
            }

            if (boostMsg.keystoneUser !== '') {
                fillBoostAfterKeyholder(boostMsg);
            }
            break;
        case emojis.moneyBag:
            if ([boostMsg.tank, boostMsg.healer, boostMsg.dps1, boostMsg.dps2].some(role => role === '') && !boostMsg.isTeamClaimed) {
                await utils.wrongRole(user, message, emoji);
                break;
            }
            if (boostMsg.isTrial && boostMsg.collector === '') {
                await utils.wrongRole(user, message, emoji);
                break;
            }
            if (boostMsg.advertiser.id !== user.id && !await utils.isManagerOrAbove(user)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            await message.reactions.removeAll();

            const voiceChannel = await message.guild.channels.create(
                `Mythic Plus ${boostMsg.boostId}`, {
                parent: channels['On-Going Boosts'],
                type: 'GUILD_VOICE',
                bitrate: 384000,
                permissionOverwrites: voicePerms(boostMsg, message.guild)
            });

            const voice = await voiceChannel.createInvite({ temporary: true, reason: 'Mythic Plus Boost' });

            boostMsg.voiceCode = `https://discord.gg/${voice.code}`;
            boostMsg.voiceChannel = voiceChannel;

            await Sheet.addMythicPlusCollections(boostMsg, message.guild)
                .catch(err => {
                    message.channel.send({ content: `Something went wrong trying to add collections for boost \`${boostMsg.boostId}\` to sheet, please contact Philip.` });
                    console.log(`Failed to add collections for boost ${boostMsg.boostId} to sheet: ${err}`)
                });

            if (!boostMsg.isTeamClaimed) {
                boostMsg.currentColor = inProgressColor;
                boostMsg.collected = true;
                const noTeamArr = [
                    boostMsg.tank,
                    boostMsg.healer,
                    boostMsg.dps1,
                    boostMsg.dps2,
                ];

                boostMsg.sheetRow = await Sheet.addMythicPlusBoost(boostMsg, message.guild)
                    .catch(async err => {
                        console.log(err);
                        message.channel.send({ content: `Something went wrong trying to add boost: \`${boostMsg.boostId}\` to sheet, please contact Philip`, ephemeral: true });
                    });

                noTeamArr.forEach(usr => {
                    if (usr) {
                        embeds.mythicPlusPickedEmbed(boostMsg, usr)
                    }
                })
                channel.send({
                    content:
                        `Boost locked,
<:TANK:${emojis.tank}> ${boostMsg.tank},
<:HEALER:${emojis.healer}> ${boostMsg.healer},
<:dps:${emojis.dps}> ${boostMsg.dps1},
<:dps:${emojis.dps}> ${boostMsg.dps2},
please check your dm's for further information.` })

                embeds.boostLoggingEmbed(client, `${user} \`started\` boost \`${boostMsg.boostId}\``)
            } else {
                const teamName = boostMsg.teamName;
                const teamBoosters = boostMsg.teamClaim[teamName];
                utils.addTeamToCooldown(boostMsg, message, teamName, teamBoosters);

                boostMsg.currentColor = inProgressColor;
                boostMsg.collected = true;

                boostMsg.sheetRow = await Sheet.addMythicPlusBoost(boostMsg, message.guild);

                channel.send({
                    content:
                        `Boost locked,
${utils.getUserMember(message.guild, teamBoosters[0])},
${utils.getUserMember(message.guild, teamBoosters[1])},
${utils.getUserMember(message.guild, teamBoosters[2])},
${utils.getUserMember(message.guild, teamBoosters[3])},
please check your dm's for further information.` })
                    .catch(err => console.log(err));
            }

            await message.react(emojis.keyComplete)
                .catch(err => console.log(err));;
            await message.react(emojis.keyDeplete)
                .catch(err => console.log(err));;

            break;
        case emojis.cancelBoost:
            if (boostMsg.advertiser.id !== user.id && !await utils.isManagerOrAbove(user)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            boostMsg.cancel = true;

            if (message.channel.id === channels['bot-spam']) {
                boostMsg.currentColor = 'ff0000';
                await message.reactions.removeAll();
                await message.edit({ embeds: [boostMsg.cancelBoost()] });
                boostMap.delete(message.id);
            } else {
                boostMap.delete(message.id);
                const embed = new MessageEmbed().setDescription('Deleting channel in 5 seconds...')
                await message.channel.send({ embeds: [embed] })
                setTimeout(() => {
                    message.channel.delete()
                    boostMsg.voiceChannel?.delete()
                }, 5000)
            }

            embeds.boostLoggingEmbed(client, `${user} \`canceled\` boost \`${boostMsg.boostId}\``)
            break;
        case emojis.check:
        case emojis.keyComplete:
        case emojis.keyDeplete:
            if (boostMsg.advertiser.id !== user.id && !await utils.isManagerOrAbove(user)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            boostMsg.currentColor = completeColor;
            boostMsg.completed = true;

            if (emoji === emojis.keyComplete) {
                boostMsg.inTime = true;
                embeds.boostLoggingEmbed(client, `${user} \`marked\` boost \`${boostMsg.boostId}\` as \`complete\``)
            } else if (emoji === emojis.keyDeplete) {
                boostMsg.inTime = false;
                embeds.boostLoggingEmbed(client, `${user} \`marked\` boost \`${boostMsg.boostId}\` as \`deplete\``)
            }

            await Sheet.updateMythicPlusBoost(boostMsg, message.guild);

            !boostMsg.isTeamClaimed
                ? await message.edit({ embeds: [boostMsg.createEmbed()] })
                : await message.edit({ embeds: [boostMsg.createTeamEmbed(message)] })

            await message.reactions.removeAll();

            let tankNickname, healerNickname, dps1Nickname, dps2Nickname;
            if (!boostMsg.isTeamClaimed) {
                tankNickname = boostMsg.tank;
                healerNickname = boostMsg.healer;
                dps1Nickname = boostMsg.dps1;
                dps2Nickname = boostMsg.dps2;
            } else {
                const teamClaimed = boostMsg.teamClaim[boostMsg.teamName];
                tankNickname = utils.getUserMember(message.guild, teamClaimed[0]);
                healerNickname = utils.getUserMember(message.guild, teamClaimed[1]);
                dps1Nickname = utils.getUserMember(message.guild, teamClaimed[2]);
                dps2Nickname = utils.getUserMember(message.guild, teamClaimed[3]);
            }

            const completeEmbed = embeds.mythicPlusAttendance(boostMsg, message.guild)

            const userArr = [
                tankNickname,
                healerNickname,
                dps1Nickname,
                dps2Nickname
            ]

            const attendanceMessage = await client.channels.cache.get(channels['attendance']).send({ content: `Boost ID: ${boostMsg.boostMessage.id}`, embeds: [completeEmbed] });

            setTimeout(async () => {
                userArr.forEach(async booster => {
                    await embeds.mythicPlusAttendanceNotification(boostMsg, booster, attendanceMessage)
                })
            }, 10000)

            if (message.channel.id !== channels['bot-spam']) {
                const deletingChannelEmbed = new MessageEmbed().setDescription('Deleting relevant channels in 10 seconds...')
                message.channel.send({ embeds: [deletingChannelEmbed] }).then(() => {
                    setTimeout(() => {
                        message.channel.delete()
                        boostMsg.voiceChannel?.delete()
                    }, 10000)
                })
            }

            break;
        case emojis.changeChannel:
            if (boostMsg.advertiser.id !== user.id && !await utils.isManagerOrAbove(user)) {
                await utils.wrongRole(user, message, emoji);
                break;
            }

            await utils.updateMplusChannelPerms(message, boostMsg);

            embeds.boostLoggingEmbed(client, `${user} \`unlocked\` boost \`${boostMsg.boostId}\` for \`${boostMsg.getAllowedRoleEnum(boostMsg.currentStack)} Key Booster\``);

            await utils.wrongRole(user, message, emoji)
            break;
        case emojis.teamTake:
            await teamClaimSignup(client, message, channel, emoji, user);
            break;
        default:
            break;
    }

    if (!boostMsg.completed) {
        !boostMsg.isTeamClaimed
            ? boostMsg.throttleEdit(message, 'normal')
            : boostMsg.throttleEdit(message, 'team');
    }
};

function fillBoostAfterKeyholder(boostMsg) {
    if (!boostMsg.tank && boostMsg.tankArray.length) {
        for (const tank of boostMsg.tankArray) {
            if (![boostMsg.tank, boostMsg.healer, boostMsg.dps1, boostMsg.dps2].some(slot => slot === tank)) {
                boostMsg.tank = tank;
                break;
            }
        }
    }

    if (!boostMsg.healer && boostMsg.healerArray.length) {
        for (const healer of boostMsg.healerArray) {
            if (![boostMsg.tank, boostMsg.healer, boostMsg.dps1, boostMsg.dps2].some(slot => slot === healer)) {
                boostMsg.healer = healer;
                break;
            }
        }
    }

    if (!boostMsg.dps1 && boostMsg.dpsArray.length) {
        for (const dps1 of boostMsg.dpsArray) {
            if (![boostMsg.tank, boostMsg.healer, boostMsg.dps1, boostMsg.dps2].some(slot => slot === dps1)) {
                boostMsg.dps1 = dps1;
                break;
            }
        }
    }

    if (!boostMsg.dps2 && boostMsg.dpsArray.length) {
        for (const dps2 of boostMsg.dpsArray) {
            if (![boostMsg.tank, boostMsg.healer, boostMsg.dps1, boostMsg.dps2].some(slot => slot === dps2)) {
                boostMsg.dps2 = dps2;
                break;
            }
        }
    }
}

function getTankRoleBasedOnKeyLevel(boostMsg) {
    let roleId;

    let AUX_KeyLevel = boostMsg.currentStack

    if (boostMsg.timed) {
        if (AUX_KeyLevel > thresholds.Timed_HighKeyBooster) {
            roleId = roles['Elite Keys Tank'];
        } else if (AUX_KeyLevel > thresholds.Timed_MidKeyBooster) {
            roleId = roles['High Keys Tank'];
        } else if (AUX_KeyLevel > thresholds.Timed_LowKeyBooster) {
            roleId = roles['Mid Keys Tank'];
        } else {
            roleId = roles['Low Keys Tank'];
        }
    } else {
        if (AUX_KeyLevel > thresholds.Untimed_HighKeyBooster) {
            roleId = roles['Elite Keys Tank'];
        } else if (AUX_KeyLevel > thresholds.Untimed_MidKeyBooster) {
            roleId = roles['High Keys Tank'];
        } else if (AUX_KeyLevel > thresholds.Untimed_LowKeyBooster) {
            roleId = roles['Mid Keys Tank'];
        } else {
            roleId = roles['Low Keys Tank'];
        }
    }

    return roleId;
}

function getHealerRoleBasedOnKeyLevel(boostMsg) {
    let roleId;

    let AUX_KeyLevel = boostMsg.currentStack

    if (boostMsg.timed) {
        if (AUX_KeyLevel > thresholds.Timed_HighKeyBooster) {
            roleId = roles['Elite Keys Healer'];
        } else if (AUX_KeyLevel > thresholds.Timed_MidKeyBooster) {
            roleId = roles['High Keys Healer'];
        } else if (AUX_KeyLevel > thresholds.Timed_LowKeyBooster) {
            roleId = roles['Mid Keys Healer'];
        } else {
            roleId = roles['Low Keys Healer'];
        }
    } else {
        if (AUX_KeyLevel > thresholds.Untimed_HighKeyBooster) {
            roleId = roles['Elite Keys Healer'];
        } else if (AUX_KeyLevel > thresholds.Untimed_MidKeyBooster) {
            roleId = roles['High Keys Healer'];
        } else if (AUX_KeyLevel > thresholds.Untimed_LowKeyBooster) {
            roleId = roles['Mid Keys Healer'];
        } else {
            roleId = roles['Low Keys Healer'];
        }
    }

    return roleId;
}

function getDpsRoleBasedOnKeyLevel(boostMsg) {
    let roleId;

    let AUX_KeyLevel = boostMsg.currentStack

    if (boostMsg.timed) {
        if (AUX_KeyLevel > thresholds.Timed_HighKeyBooster) {
            roleId = roles['Elite Keys DPS'];
        } else if (AUX_KeyLevel > thresholds.Timed_MidKeyBooster) {
            roleId = roles['High Keys DPS'];
        } else if (AUX_KeyLevel > thresholds.Timed_LowKeyBooster) {
            roleId = roles['Mid Keys DPS'];
        } else {
            roleId = roles['Low Keys DPS'];
        }
    } else {
        if (AUX_KeyLevel > thresholds.Untimed_HighKeyBooster) {
            roleId = roles['Elite Keys DPS'];
        } else if (AUX_KeyLevel > thresholds.Untimed_MidKeyBooster) {
            roleId = roles['High Keys DPS'];
        } else if (AUX_KeyLevel > thresholds.Untimed_LowKeyBooster) {
            roleId = roles['Mid Keys DPS'];
        } else {
            roleId = roles['Low Keys DPS'];
        }
    }

    return roleId;
}
