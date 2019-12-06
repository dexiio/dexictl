const FS = require('fs');
const Configure = require('./configure');
const DexiClient = require('../src/DexiClient');

module.exports = async function() {
    const config = await Configure.ensureConfig();

    let status = 'OK';

    try {
        const client = new DexiClient(config);
        config.proxy = await client.getAppProxyUrl();
    } catch(err) {
        status = 'Failed to connect to API: ' + err;
        if (err.url && err.method) {
            status += ` [${err.method} ${err.url}]`;
        }
    }

    if (!config.proxy) {
        config.proxy = 'Unknown';
    }

    console.log('--------------------------------------------------------------------------');
    console.log('#                          Current configuration                         #');
    console.log('--------------------------------------------------------------------------');
    console.log('   User ID: %s', config.userId);
    console.log('Account ID: %s', config.accountId);
    console.log('   API Key: %s', config.apiKey);
    console.log('   API Url: %s', config.url);
    console.log(' Proxy Url: %s', config.proxy);
    console.log('    Status: %s', status);
    console.log('--------------------------------------------------------------------------\n');

};