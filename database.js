const MongoDBMemoryServer = require('mongodb-memory-server');
const fs = require('fs');
const os = require('os');

(async () => {
    const mongod = await MongoDBMemoryServer.MongoMemoryServer.create({
        instance: {
            port: 43333
        }
    });

    const ENV_VARS = fs.readFileSync('.env', 'utf-8').split(os.EOL);

    const target = ENV_VARS.findIndex(envVar => envVar.startsWith('MONGODB_URI='));
    ENV_VARS.splice(target, 1, `MONGODB_URI=${mongod.getUri()}`);

    fs.writeFileSync('.env', ENV_VARS.join(os.EOL));

    console.log(`MondoDB is running and .env is updated`);
})();