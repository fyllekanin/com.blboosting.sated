/* eslint-disable */
const { google } = require('googleapis');
const utils = require('../common/utils/utils');

const dataSheet = process.env.DATA_SHEET_ID;
const bookingSheet = process.env.BOOKING_SHEET_ID;

let auth;
function setup() {
    auth = new google.auth.GoogleAuth({
        keyFile: './bloodlust-boosting-bd35dba290da.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

async function addBalance(userToAdd, amount, guild, note) {
    let userToAddNickname = await utils.getNickname(userToAdd, guild);

    return new Promise((resolve, reject) => {
        const sheets = google.sheets({ version: 'v4', auth });

        const userToAddN_S = userToAddNickname.split('-');

        const ts = Date.now();

        const date_ob = new Date(ts);

        const date = date_ob.getDate();
        const month = date_ob.getMonth() + 1;
        const year = date_ob.getFullYear()
        const hours = date_ob.getHours();
        const minutes = date_ob.getMinutes();
        const seconds = date_ob.getSeconds();

        const dateDay = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;

        sheets.spreadsheets.values.append({
            spreadsheetId: dataSheet,
            range: 'ManualAttendance!B5', // Or where you need the data to go
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        `${note}`,
                        `${dateDay}`,
                        `${userToAddN_S[0]}`,
                        `${userToAddN_S[1]}`,
                        `${amount}`,
                    ],
                ],
            },
        }, (err, response) => {
            if (err) {
                console.log(`Error adding balance to userId: ${userToAdd.id} with the ammount of ${amount}`);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

async function removeBalance(userToAdd, amount, guild, note) {
    let userToAddNickname = await utils.getNickname(userToAdd, guild);

    return new Promise((resolve, reject) => {
        const sheets = google.sheets({ version: 'v4', auth });

        const userToAddN_S = userToAddNickname.split('-');

        const ts = Date.now();

        const date_ob = new Date(ts);

        const date = date_ob.getDate();
        const month = date_ob.getMonth() + 1;
        const year = date_ob.getFullYear()
        const hours = date_ob.getHours();
        const minutes = date_ob.getMinutes();
        const seconds = date_ob.getSeconds();

        const dateDay = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;

        sheets.spreadsheets.values.append({
            spreadsheetId: dataSheet,
            range: 'Deducts!B5', // Or where you need the data to go
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        `${note}`,
                        `${dateDay}`,
                        `${userToAddN_S[0]}`,
                        `${userToAddN_S[1]}`,
                        `${amount}`,
                    ],
                ],
            },
        }, (err, response) => {
            if (err) {
                console.log(`Error adding balance to userId: ${userToAdd.id} with the ammount of ${amount}`);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function getBalance(userNickName) {
    return new Promise(resolve => {
        let userN_SAux = userNickName.split('-');
        let userN_S = [];
        userN_S[0] = userN_SAux[0];
        userN_S[1] = userNickName.replace(`${userN_SAux[0]}-`, '');

        const sheets = google.sheets({ version: 'v4', auth });
        sheets.spreadsheets.values.get({
            spreadsheetId: dataSheet,
            range: 'Balance!B7:C',
        }, (err, res) => {
            const rows = res.data.values;
            if (rows.length) {
                rows.map((row) => {
                    if (row[0] === userNickName) {
                        if (row[1] !== undefined && row[1] != null && row[1] !== '') {
                            resolve(row[1]);
                        } else {
                            resolve('0');
                        }
                    }
                });
            } else {
                console.log('No data found.');
            }
            resolve('0');
        });
    });
}

async function updateMythicPlusBoost(boost, guild) {
    let advNickname = await utils.getNickname(boost.advertiser, guild);
    let tankNickname;
    let healerNickname;
    let dps1Nickname;
    let dps2Nickname;
    if (!boost.isTeamClaimed) {
        tankNickname = await utils.getNickname(boost.tank, guild);
        healerNickname = await utils.getNickname(boost.healer, guild);
        dps1Nickname = await utils.getNickname(boost.dps1, guild);
        dps2Nickname = await utils.getNickname(boost.dps2, guild);
    } else {
        const teamClaimed = boost.teamClaim[boost.teamName];
        let u1 = utils.getUserMember(guild, teamClaimed[0])
        let u2 = utils.getUserMember(guild, teamClaimed[1])
        let u3 = utils.getUserMember(guild, teamClaimed[2])
        let u4 = utils.getUserMember(guild, teamClaimed[3])

        tankNickname = await utils.getNickname(u1, guild);
        healerNickname = await utils.getNickname(u2, guild);
        dps1Nickname = await utils.getNickname(u3, guild);
        dps2Nickname = await utils.getNickname(u4, guild);
    }
    const amountKeys = boost.keys.length;

    return new Promise(resolve => {
        const sheets = google.sheets({ version: 'v4', auth });

        const advN_S = advNickname.split('-');
        const tankN_S = tankNickname.split('-');
        const healerN_S = healerNickname.split('-');
        const dps1N_S = dps1Nickname.split('-');
        const dps2N_S = dps2Nickname.split('-');

        let complete = '';
        let deplete = '';

        if (boost.inTime) {
            complete = 'TRUE';
        } else if (!boost.inTime) {
            deplete = 'TRUE';
        }

        sheets.spreadsheets.values.update({
            spreadsheetId: bookingSheet,
            range: boost.sheetRow, // Or where you need the data to go
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [
                        `${boost.boostId}`,
                        `${boost.date}`,
                        `${amountKeys}`, // amount
                        `${boost.dungeon}`, // keystone
                        `${boost.TimedUntimed}`, // Timed untimed
                        `${boost.source}`,
                        `${deplete}`,//Deplete
                        `[H]`,
                        ``,
                        `${boost.armorStackName}`,//armorStack
                        `${boost.totalPot}`,
                        '',
                        '',
                        `${advN_S[0]}`,
                        `${advN_S[1]}`,
                        '',
                        '',
                        `${complete}`,//Complete
                        '',//Hidden columns
                        '',//Hidden columns
                        '',//Hidden columns
                        '',//Hidden columns
                        `${tankN_S[0]}`,
                        `${tankN_S[1]}`,
                        '',
                        '',
                        `${healerN_S[0]}`,
                        `${healerN_S[1]}`,
                        '',
                        '',
                        `${dps1N_S[0]}`,
                        `${dps1N_S[1]}`,
                        '',
                        '',
                        `${dps2N_S[0]}`,
                        `${dps2N_S[1]}`,
                        '',
                        '',
                        '',
                        '',
                    ],
                ],
            },
        }, (err, response) => {
            if (err) {
                //console.log(`Error adding balance to userId: ${userToAdd.id} with the ammount of ${amount}`);
                resolve(false);
            } else {
                // console.log(response);
                resolve(true);
            }
        });
    });
}


async function addMythicPlusBoost(boost, guild) {
    let advNickname = await utils.getNickname(boost.advertiser, guild);
    let tankNickname;
    let healerNickname;
    let dps1Nickname;
    let dps2Nickname;
    if (!boost.isTeamClaimed) {
        tankNickname = await utils.getNickname(boost.tank, guild);
        healerNickname = await utils.getNickname(boost.healer, guild);
        dps1Nickname = await utils.getNickname(boost.dps1, guild);
        dps2Nickname = await utils.getNickname(boost.dps2, guild);
    } else {
        const teamClaimed = boost.teamClaim[boost.teamName];
        let u1 = utils.getUserMember(guild, teamClaimed[0])
        let u2 = utils.getUserMember(guild, teamClaimed[1])
        let u3 = utils.getUserMember(guild, teamClaimed[2])
        let u4 = utils.getUserMember(guild, teamClaimed[3])

        tankNickname = await utils.getNickname(u1, guild);
        healerNickname = await utils.getNickname(u2, guild);
        dps1Nickname = await utils.getNickname(u3, guild);
        dps2Nickname = await utils.getNickname(u4, guild);
    }
    const amountKeys = boost.keys.length;

    return new Promise((resolve, reject) => {
        const sheets = google.sheets({ version: 'v4', auth });

        const advN_S = advNickname.split('-');
        const tankN_S = tankNickname.split('-');
        const healerN_S = healerNickname.split('-');
        const dps1N_S = dps1Nickname.split('-');
        const dps2N_S = dps2Nickname.split('-');

        sheets.spreadsheets.values.append({
            spreadsheetId: bookingSheet,
            range: 'MythicPlusBooking!B8', // Or where you need the data to go
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        `${boost.boostId}`,
                        `${boost.date}`,
                        `${amountKeys}`, // amount
                        `${boost.dungeon}`, // keystone
                        `${boost.TimedUntimed}`, // Timed untimed
                        `${boost.source}`,
                        '',//Deplete
                        `[H]`,
                        ``,
                        `${boost.armorStackName}`,//armorStack
                        `${boost.totalPot}`,
                        '',
                        '',
                        `${advN_S[0]}`,
                        `${advN_S[1]}`,
                        '',
                        '',
                        '',//Complete
                        '',//Hidden columns
                        '',//Hidden columns
                        '',//Hidden columns
                        '',//Hidden columns
                        `${tankN_S[0]}`,
                        `${tankN_S[1]}`,
                        '',
                        '',
                        `${healerN_S[0]}`,
                        `${healerN_S[1]}`,
                        '',
                        '',
                        `${dps1N_S[0]}`,
                        `${dps1N_S[1]}`,
                        '',
                        '',
                        `${dps2N_S[0]}`,
                        `${dps2N_S[1]}`,
                        '',
                        '',
                        '',
                        '',
                    ],
                ],
            },
        }, (err, response) => {
            if (err) {
                console.log(`Error adding boost ${boost.boostId} to sheet: ${err}`);
                reject(err);
            } else {
                // console.log(response);
                resolve(response.data.updates.updatedRange);
            }
        });
    });
}

async function addMythicPlusCollections(boost, guild) {
    const date = [];
    const boostId = [];
    const collectors = [];
    const empty = [];
    for (let i = 0; i < boost.payments.length; i++) {
        date.push(boost.date);
        boostId.push(boost.messageId);
        const collectorNickname = await utils.getNickname(boost.payments[i].collectorId, guild);
        collectors.push(collectorNickname.split('-')?.[0]);
        empty.push('');
    }

    const amounts = boost.payments.map(collection => collection.amount);
    const realms = boost.payments.map(collection => collection.realm.concat(collection.faction === 'HORDE' ? ' [H]' : ' [A]'));

    return new Promise((resolve, reject) => {
        const sheets = google.sheets({ version: 'v4', auth });

        sheets.spreadsheets.values.append({
            spreadsheetId: bookingSheet,
            range: 'AUTO COLLECT!B8:H', // Or where you need the data to go
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    boostId, // Date
                    date, // Boost ID
                    collectors, // Collector name
                    empty, // Collector server (don't touch)
                    realms, // Server collected on
                    amounts, // Amount
                    empty, // Combined ID (For Zaazu, don't touch)
                ],
                majorDimension: "COLUMNS",
            },
        }, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
}

module.exports = {
    setup,
    addBalance,
    removeBalance,
    getBalance,
    addMythicPlusBoost,
    updateMythicPlusBoost,
    addMythicPlusCollections,
};
