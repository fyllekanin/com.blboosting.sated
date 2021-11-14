const ncp = require('ncp').ncp;
const fs = require('fs');

ncp.limit = 16;

console.log('Starting to copy assets.');
const promises = [
    new Promise(res => {
        ncp('src/JSON', 'dist/JSON', function (err) {
            if (err) {
                return console.error(err);
            }
            res();
        });
    }),
    new Promise(res => {
        fs.copyFile('.env', 'dist/.env', err => {
            if (err) {
                return console.error(err);
            }
            res();
        })
    })
];

Promise.all(promises).then(() => console.log('Done copying assets.'));