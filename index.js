const program = require('commander');
const packageData = require('./package.json');
const Configure = require('./actions/configure');

program.name('dexictl')
    .version(packageData.version);

program
    .command('develop <port>')
    .description('Starts the dexi app development client for local app running on given port')
    .action(require('./actions/develop'));

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

Configure.ensureConfig().then(() => {
    if (process.argv.length < 3) {
        console.error('No command specified\n');
        program.help();
        process.exit(1);
    }

    program.parse(process.argv);
}).catch((err) => {
    console.log('Error: %s', err);
    process.exit(1);
});

