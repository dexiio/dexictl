const FS = require('fs');
const inquirer = require('inquirer');
const Handlebars = require('handlebars');

function split(text) {
    return text.split(/,/g).map((part) => part.trim());
}

function getTemplate(name) {
    const template = FS.readFileSync(__dirname + '/../templates/' + name + '.hbs').toString();
    return Handlebars.compile(template);
}

module.exports = async function(name) {

    if (FS.existsSync('./dexi.yml')) {
        console.error('dexi.yml file already exists in current directory. Aborting...');
        process.exit(1);
    }

    console.log('name', name);

    if (!name) {
        console.error('Missing app name');
        process.exit(1);
    }

    const required = (value) => !!value;

    const app = {
        name: name,
        title: name,
        description: '',
        categories: [],
        baseUrl: 'http://localhost:4000'
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
            name: 'categories',
            message: "Write a comma-separated list of categories:",
            default: app.categories.join(','),
            validate: required
        },
        {
            type: 'input',
            name: 'baseUrl',
            message: "Specify the public base url where your app service can be reached:",
            default: app.baseUrl,
            validate: required
        }
    ];

    return inquirer.prompt(questions).then(answers => {
        app.title = answers.title;
        app.description = answers.description;
        app.baseUrl = answers.baseUrl;
        app.categories = split(answers.categories);

        const tmpl = getTemplate('dexi.yml');

        const yml = tmpl({app});

        FS.writeFileSync(process.cwd() + '/dexi.yml', yml);

        console.log('Created dexi.yml file in %s', process.cwd());
    });

};