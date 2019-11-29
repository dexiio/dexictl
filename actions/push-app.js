const FS = require('fs');
const Configure = require('./configure');
const DexiClient = require('../src/DexiClient');

module.exports = async function() {

    if (!FS.existsSync('./dexi.yml')) {
        console.error('dexi.yml file not found in current directory. Aborting...');
        process.exit(1);
    }

    const yaml = FS.readFileSync('./dexi.yml').toString();

    const config = await Configure.ensureConfig();
    const client = new DexiClient(config);

    console.log('Pushing app to dexi - please wait...');

    try {
        await client.pushApp(yaml);
        console.log('App pushed succesfully!');
    } catch(err) {
        if (err.body && err.body.msg) {
            const errorDoc = err.body;
            console.log('Failed to push app: %s', errorDoc.msg);

            if (errorDoc.errors) {
                errorDoc.errors.forEach((errorLine) => {
                    console.log('- %s[%s]: %s', errorLine.type, errorLine.name, errorLine.message);
                })
            }

        } else {
            console.log('Failed to push app: ' + err);
        }
    }

};