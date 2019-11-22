const Path = require('path');
const FS = require('fs');
const HOMEDIR = require('os').homedir();
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');

const DEXI_CONFIG_FILE = HOMEDIR + Path.sep + '.dexi' + Path.sep + 'dexictl.json';

const API = {};

API.getConfiguration = function() {
    if (!FS.existsSync(DEXI_CONFIG_FILE)) {
        return {};
    }

    return JSON.parse(FS.readFileSync(DEXI_CONFIG_FILE).toString());
};

API.configure = function() {
    const required = (value) => !!value;

    const existingConfig = API.getConfiguration();

    const defaults = Object.assign({
        url: 'https://app-developer.dexi.io'
    }, existingConfig);

    const questions = [
        {
            type: 'input',
            name: 'accountId',
            message: "Specify your dexi.io account id:",
            validate: required,
            default: defaults.accountId
        },
        {
            type: 'input',
            name: 'userId',
            message: "Specify your dexi.io user id:",
            default: defaults.userId,
            validate: required
        },
        {
            type: 'input',
            name: 'apiKey',
            message: "Specify your dexi.io API key:",
            default: defaults.apiKey,
            validate: required
        },
        {
            type: 'input',
            name: 'url',
            message: "Specify the dexi.io api URL:",
            default: defaults.url,
            validate: required
        }
    ];

    return inquirer.prompt(questions).then(answers => {
        mkdirp.sync(Path.dirname(DEXI_CONFIG_FILE));
        FS.writeFileSync(DEXI_CONFIG_FILE, JSON.stringify(answers, null, 2));

        return answers;
    });
};

API.reconfigure = function() {
    return API.configure();
};

API.ensureConfig = function() {
    if (!FS.existsSync(DEXI_CONFIG_FILE)) {
        return API.configure();
    }

    return Promise.resolve(this.getConfiguration());
};

module.exports = API;