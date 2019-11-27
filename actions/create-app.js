const FS = require('fs');
const inquirer = require('inquirer');
const Handlebars = require('handlebars');
const camelCase = require('camelcase');
const mkdirp = require('mkdirp');

function split(text) {
    return text.split(/,/g).map((part) => part.trim());
}

function getTemplate(name) {
    const template = FS.readFileSync(__dirname + '/../templates/' + name + '.hbs').toString();
    return Handlebars.compile(template);
}

function generateDexiYML(app) {
    const dexyYmlTemplate = getTemplate('dexi.yml');

    const yml = dexyYmlTemplate({app});

    FS.writeFileSync(process.cwd() + '/dexi.yml', yml);

    console.log('Created dexi.yml file in %s', process.cwd());
}

function generatePomXML(app) {
    const pomXMLTemplate = getTemplate('pom.xml');
    const pom = pomXMLTemplate({app});

    FS.writeFileSync(process.cwd() + '/pom.xml', pom);

    console.log('Created pom.xml file in %s', process.cwd());
}

function generateApplicationClass(app) {
    const applicationClassTemplate = getTemplate('Application.java');
    const java = applicationClassTemplate({app});

    const baseJavaDir = process.cwd() + '/src/main/java/' + app.groupId.split(/\./g).join('/');
    mkdirp.sync(baseJavaDir);

    const fullPath = baseJavaDir + '/' + app.mainClass + '.java';

    FS.writeFileSync(fullPath, java);

    console.log('Wrote %s', fullPath);
}

function generateApplicationYML(app) {
    const applicationYmlTemplate = getTemplate('application.yml');
    const appYml = applicationYmlTemplate({app});

    const baseResourcesDir = process.cwd() + '/src/main/resources';
    mkdirp.sync(baseResourcesDir);

    const fullPath = baseResourcesDir + '/application.yml';

    FS.writeFileSync(fullPath, appYml);

    console.log('Wrote %s', fullPath);
}

module.exports = async function(name) {

    if (FS.existsSync('./dexi.yml')) {
        console.error('dexi.yml file already exists in current directory. Aborting...');
        process.exit(1);
    }

    if (!name) {
        console.error('Missing app name');
        process.exit(1);
    }

    const required = (value) => !!value;

    const camelCaseName = camelCase(name, {pascalCase: true});

    const app = {
        name: name,
        title: name,
        description: '',
        categories: [],
        groupId: 'io.dexi',
        mainClass: camelCaseName + 'ServiceApplication',
        port: '4000'
    };

    const questions = [
        {
            type: 'input',
            name: 'title',
            message: "Specify app title:",
            validate: required,
            default: app.title
        },
        {
            type: 'input',
            name: 'description',
            message: "Describe your app:",
            default: app.description,
            validate: required
        },
        {
            type: 'input',
            name: 'groupId',
            message: "Specify the Java package name of your main class:",
            default: app.groupId,
            validate: required
        },
        {
            type: 'input',
            name: 'mainClass',
            message: "Specify the name of your main class:",
            default: app.mainClass,
            validate: required
        },
        {
            type: 'input',
            name: 'port',
            message: "Specify the port your service should run on:",
            default: app.port,
            validate: required
        },
        {
            type: 'input',
            name: 'categories',
            message: "Write a comma-separated list of categories:",
            default: app.categories.join(','),
        }
    ];

    return inquirer.prompt(questions).then(answers => {
        app.title = answers.title;
        app.description = answers.description;
        app.baseUrl = answers.baseUrl;
        app.categories = split(answers.categories);
        app.groupId = answers.groupId;
        app.mainClass = answers.mainClass;
        app.port = answers.port;

        generateDexiYML(app);

        if (!FS.existsSync('./pom.xml')) {
            //Pom.xml
            generatePomXML(app);

            //Java Main class
            generateApplicationClass(app);

            //application.yml
            generateApplicationYML(app);

        }

    });

};