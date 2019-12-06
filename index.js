const program = require('commander');
const packageData = require('./package.json');
const Configure = require('./actions/configure');

program.name('dexictl')
    .version(packageData.version);

program
    .command('develop <port>')
    .description('Starts the dexi app development client for local app running on given port')
    .option('-S, --silent', 'Do not show traffic being routed to your local instance')
    .action(require('./actions/develop'));


program
    .command('create-app <name>')
    .description('Creates new dexi.yml with the given name')
    .action(require('./actions/create-app'));

program
    .command('push-app')
    .description('Push dexi.yml from current folder to dexi')
    .action(require('./actions/push-app'));

program
    .command('info')
    .description('Show information about current configuration')
    .action(require('./actions/info'));


program
    .command('config')
    .description('Configure your credentials for dexi.io')
    .action(Configure.reconfigure);

console.log(`

      _           _   _        
   __| | _____  _(_) (_) ___   
  / _\` |/ _ \\ \\/ / | | |/ _ \\  
 | (_| |  __/>  <| |_| | (_) | 
  \\__,_|\\___/_/\\_\\_(_)_|\\___/  


`);

const command = process.argv[2];
let didConfigure = false;

if (!Configure.hasConfig()) {
    didConfigure = true;
}

Configure.ensureConfig().then(() => {
    if (process.argv.length < 3) {
        console.error('No command specified\n');
        program.help();
        process.exit(1);
    }

    if (didConfigure &&
        command === 'config') {
        //Avoid double configuration
        return;
    }

    program.parse(process.argv);
}).catch((err) => {
    console.log('Error: %s', err);
    process.exit(1);
});

