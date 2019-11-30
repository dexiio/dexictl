const FS = require('fs');
const Path = require('path');
const Configure = require('./configure');
const ProxyClient = require('../src/proxy-client/ProxyClient');

module.exports = async function develop(port, command) {

    const config = await Configure.ensureConfig();
    config.port = port;
    config.path = process.cwd() + Path.sep + 'dexi.yml';
    config.debug = !command.opts().silent;

    if (!FS.existsSync(config.path)) {
        console.error('');
        console.error('Failed to start dexi app development client!');
        console.error('');
        console.error('Could not find dexi.yml file in current folder: %s', process.cwd());
        console.error('Run "dexictl develop" from inside of a folder that contains a dexi.yml file');
        console.error('');
        process.exit(1);
        return;
    }

    try {
        const proxyClient = new ProxyClient(config);
        await proxyClient.connect();
        proxyClient.startWatching();

        process.on("SIGINT", function () {
            if (proxyClient.isActive()) {
                console.log('Asking server to delete registration. Exiting in 3 seconds...');
                proxyClient.deregister();
                setTimeout(() => {
                    console.log('Exiting...');
                    process.exit();
                }, 3000);
            } else {
                process.exit();
            }
        });

    } catch(err) {
        console.error('Error: %s', err.message);
        process.exit(1);
    }
};