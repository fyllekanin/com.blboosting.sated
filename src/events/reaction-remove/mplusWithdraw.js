const emojis = require('../../JSON/emojis.json');
const utils = require('../../common/utils/utils');
const embeds = require('../../common/utils/embeds')
const boostMap = require('../../models/maps/boosts');
const teamClaimWithdraw = require('./teamClaim');

module.exports = async (client, message, channel, emoji, user) => {
    const boostMsg = boostMap.get(message.id);
    if (!boostMsg || boostMsg.collected) return;

    user = message.guild.members.cache.get(user.id);

    switch (emoji) {
        case emojis.tank:
            if (!boostMsg.tankArray.includes(user)) return;

            boostMsg.tankArray.splice(boostMsg.tankArray.indexOf(user), 1)
            embeds.boostLoggingEmbed(client, `${user} \`unsigned\` from boost \`${boostMsg.boostId}\` as a \`tank\``);

            if (boostMsg.tank === user) {
                boostMsg.tank = '';

                for (tanks of boostMsg.tankArray) {
                    if (boostMsg.validateUniqueSign(tanks)) {
                        boostMsg.tank = tanks;
                        break;
                    }
                }

                if (boostMsg.keystoneUser === user) {
                    boostMsg.keystoneUser = '';
                    if (pickAnotherKeyholder(boostMsg) !== user) {
                        await utils.wrongRole(user, message, 'keystone')
                    } else if (pickAnotherKeyholder(boostMsg)) {
                        fillBoostAfterKeyholder(boostMsg)
                    }
                }
            }
            break;
        case emojis.healer:
            if (!boostMsg.healerArray.includes(user)) return;

            boostMsg.healerArray.splice(boostMsg.healerArray.indexOf(user), 1);
            embeds.boostLoggingEmbed(client, `${user} \`unsigned\` from boost \`${boostMsg.boostId}\` as a \`healer\``);

            if (boostMsg.healer === user) {
                boostMsg.healer = '';

                for (healers of boostMsg.healerArray) {
                    if (boostMsg.validateUniqueSign(healers)) {
                        boostMsg.healer = healers;
                        break;
                    }
                }

                if (boostMsg.keystoneUser === user) {
                    boostMsg.keystoneUser = '';
                    if (pickAnotherKeyholder(boostMsg) !== user) {
                        await utils.wrongRole(user, message, 'keystone')
                    } else if (pickAnotherKeyholder(boostMsg)) {
                        fillBoostAfterKeyholder(boostMsg)
                    }
                }
            }
            break;
        case emojis.dps:
            if (!boostMsg.dpsArray.includes(user)) return;

            boostMsg.dpsArray.splice(boostMsg.dpsArray.indexOf(user), 1);
            embeds.boostLoggingEmbed(client, `${user} \`unsigned\` from boost \`${boostMsg.boostId}\` as a \`dps\``);

            if (boostMsg.dps1 === user) {
                boostMsg.dps1 = '';

                for (dpsers of boostMsg.dpsArray) {
                    if (dpsers !== boostMsg.dps2 && boostMsg.validateUniqueSign(dpsers)) {
                        boostMsg.dps1 = dpsers;
                        break;
                    }
                }

                if (boostMsg.keystoneUser === user) {
                    boostMsg.keystoneUser = '';
                    if (pickAnotherKeyholder(boostMsg) !== user) {
                        await utils.wrongRole(user, message, 'keystone')
                    } else if (pickAnotherKeyholder(boostMsg)) {
                        fillBoostAfterKeyholder(boostMsg)
                    }
                }
            } else if (boostMsg.dps2 === user) {
                boostMsg.dps2 = '';

                for (dpsers of boostMsg.dpsArray) {
                    if (dpsers !== boostMsg.dps1 && boostMsg.validateUniqueSign(dpsers)) {
                        boostMsg.dps2 = dpsers;
                        break;
                    }
                }

                if (boostMsg.keystoneUser === user) {
                    boostMsg.keystoneUser = '';
                    if (pickAnotherKeyholder(boostMsg) !== user) {
                        await utils.wrongRole(user, message, 'keystone')
                    } else if (pickAnotherKeyholder(boostMsg)) {
                        fillBoostAfterKeyholder(boostMsg)
                    }
                }
            }
            break;
        case emojis.keystone:
            if (!boostMsg.keyholderArray.includes(user)) return;

            boostMsg.keyholderArray.splice(boostMsg.keyholderArray.indexOf(user), 1);
            embeds.boostLoggingEmbed(client, `${user} \`unsigned\` from boost \`${boostMsg.boostId}\` as a \`keyholder\``);

            if (boostMsg.keystoneUser === user) {
                boostMsg.keystoneUser = '';
                if (boostMsg.tank === user) {
                    boostMsg.tank = '';
                } else if (boostMsg.healer === user) {
                    boostMsg.healer = '';
                } else if (boostMsg.dps1 === user || boostMsg.dps2 === user) {
                    if (boostMsg.dps1 === user) {
                        boostMsg.dps1 = '';
                    } else {
                        boostMsg.dps2 = '';
                    }
                }
                if (pickAnotherKeyholder(boostMsg)) {
                    fillBoostAfterKeyholder(boostMsg)
                }
            }
            break;
        case emojis.teamTake:
            await teamClaimWithdraw(client, message, channel, emoji, user);
            break;
    }

    !boostMsg.isTeamClaimed
        ? boostMsg.throttleEdit(message, 'normal')
        : boostMsg.throttleEdit(message, 'team');
};

function pickAnotherKeyholder(boostMsg) {
    for (keyH of boostMsg.keyholderArray) {
        if (boostMsg.tankArray.includes(keyH)) {
            if (boostMsg.tank !== keyH && boostMsg.healer !== keyH && boostMsg.dps1 !== keyH && boostMsg.dps2 !== keyH) {
                boostMsg.tank = keyH
                boostMsg.keystoneUser = keyH

                return keyH
            } else if (boostMsg.tank === keyH) {
                boostMsg.keystoneUser = keyH

                return keyH
            }
        } else if (boostMsg.healerArray.includes(keyH)) {
            if (boostMsg.healer !== keyH && boostMsg.tank !== keyH && boostMsg.dps1 !== keyH && boostMsg.dps2 !== keyH) {
                boostMsg.healer = keyH
                boostMsg.keystoneUser = keyH

                return keyH
            } else if (boostMsg.healer === keyH) {
                boostMsg.keystoneUser = keyH

                return keyH
            }
        } else if (boostMsg.dpsArray.includes(keyH)) {
            if (boostMsg.dps1 === keyH || boostMsg.dps2 === keyH) {
                boostMsg.keystoneUser = keyH

                return keyH
            } else if (boostMsg.dps1 !== keyH && boostMsg.dps2 !== keyH) {
                boostMsg.keystoneUser = keyH
                boostMsg.dps2 = keyH

                return keyH
            }
        }
    }
    boostMsg.tank = ''
    boostMsg.healer = ''
    boostMsg.dps1 = ''
    boostMsg.dps2 = ''
    return false
}

function fillBoostAfterKeyholder(boostMsg) {
    if (boostMsg.tank === '') {
        for (tanks of boostMsg.tankArray) {
            if (tanks !== boostMsg.dps1 && tanks !== boostMsg.dps2 && tanks !== boostMsg.healer) {
                boostMsg.tank = tanks;
                break;
            }
            // break;
        }
        // if (boostMsg.tankArray[0] != null && boostMsg.healer !== boostMsg.tankArray[0] && boostMsg.dps1 !== boostMsg.tankArray[0] && boostMsg.dps2 !== boostMsg.tankArray[0]) {
        // 	boostMsg.tank = boostMsg.tankArray[0];
        // }
    }

    if (boostMsg.healer === '') {
        for (healers of boostMsg.healerArray) {
            if (healers !== boostMsg.dps1 && healers !== boostMsg.dps2 && healers !== boostMsg.tank) {
                boostMsg.healer = healers;
                break;
            }
            // break;
        };
        // if (boostMsg.healerArray[0] != null && boostMsg.tank !== boostMsg.healerArray[0] && boostMsg.dps1 !== boostMsg.healerArray[0] && boostMsg.dps2 !== boostMsg.healerArray[0]) {
        // 	boostMsg.healer = boostMsg.healerArray[0];
        // }
    }

    if (boostMsg.dps1 === '') {
        for (dpsers of boostMsg.dpsArray) {
            if (dpsers !== boostMsg.dps2 && dpsers !== boostMsg.healer && dpsers !== boostMsg.tank) {
                boostMsg.dps1 = dpsers;
                break;
            }
            // break;
        };
        // if (boostMsg.dpsArray[0] != null && boostMsg.tank !== boostMsg.dpsArray[0] && boostMsg.healer !== boostMsg.dpsArray[0] && boostMsg.dps2 !== boostMsg.dpsArray[0]) {
        // 	boostMsg.dps1 = boostMsg.dpsArray[0];
        // }
    }

    if (boostMsg.dps2 === '') {
        for (dpsers of boostMsg.dpsArray) {
            if (dpsers !== boostMsg.dps1 && dpsers !== boostMsg.healer && dpsers !== boostMsg.tank) {
                boostMsg.dps2 = dpsers;
                break;
            }
            // break;
        };
    }
}