const FS = require('fs');
const YAML = require('js-yaml');
const HTTP = require('http');
const md5 = require('md5');

const DexiClient = require('../DexiClient');
const Connection = require('./Connection');
const {CommandType, CommandStatus} = require('./Commands');

class ProxyClient {
    /**
     *
     * @param {{port:number,path:string,userId:string,accountId:string,apiKey:string,url?:string,debug?:boolean}} opts
     */
    constructor(opts) {
        if (!opts.port) {
            throw new Error('Port is missing');
        }

        if (!opts.path) {
            throw new Error('Path is missing');
        }

        if (!FS.existsSync(opts.path)) {
            throw new Error('File does not exist: ' + opts.path);
        }

        if (!opts.userId) {
            throw new Error('Missing user id');
        }

        if (!opts.accountId) {
            throw new Error('Missing account id');
        }

        if (!opts.apiKey) {
            throw new Error('Missing api key');
        }

        if (!opts.url) {
            opts.url = 'https://api.dexi.io';
        }

        this._port = opts.port;
        this._debug = !!opts.debug;
        this._url = opts.url;
        this._path = opts.path;

        this._appJson = this._readAppYamlAsJson(this._path);
        this._connection = null;

        this._clientInfo = {
            userId: opts.userId,
            accountId: opts.accountId,
            accessKey: md5(opts.accountId + opts.apiKey),
            appName: this._appJson.name
        };

        this._client = new DexiClient(this._url, this._clientInfo);
    }

    async connect() {
        const url = await this._client.getAppProxyUrl();
        this._connection = new Connection(url);
        this._connection.addMessageHandler(CommandType.REGISTER, this._handleRegisterResult.bind(this));
        this._connection.addMessageHandler(CommandType.APP_SAVE, this._handleSaveAppYamlResult.bind(this));
        this._connection.addMessageHandler(CommandType.APP_REQUEST, this._handleAppRequest.bind(this));
        this._connection.addMessageHandler(CommandStatus.ERROR, this._handleMessageError.bind(this));

        console.log(new Date().toString() + ' Registering with App Proxy Server on ' + url + '...');
        this._connection.register(this._clientInfo);
    }

    isActive() {
        return (this._connection && this._connection.isOpen());
    }

    close() {
        if (this._connection &&
            this._connection.isOpen()) {
            this._connection.deregister(this._appJson.name);
            this._connection.close();
        }
    }

    deregister() {
        if (this._connection &&
            this._connection.isOpen()) {
            this._connection.deregister(this._appJson.name);
        }
    }

    _readAppYamlAsJson(filepath) {
        let appYaml = FS.readFileSync(filepath, 'utf8');
        return YAML.safeLoad(appYaml, {json: true});
    }
    
    _getAppYamlMD5() {
        md5(FS.readFileSync(this._path).toString())
    }

    startWatching() {
        let md5Previous = this._getAppYamlMD5();
        let fsWait = false;
        FS.watch(this._path, (eventType, filename) => {
            if (!filename) {
                return;
            }
            if (fsWait) {
                return;
            }

            fsWait = setTimeout(() => {
                fsWait = false;
            }, 100);

            const md5Current = this._getAppYamlMD5();
            if (md5Current === md5Previous) {
                return;
            }

            md5Previous = md5Current;

            switch (eventType) {
                case 'rename':
                    // TODO: add support for renaming (e.g. deleting) of files
                    break;
                case 'change':
                    console.log(new Date().toString(), 'Detected a change in ' + this._path + '...');
                    let appJson = this._readAppYamlAsJson(this._path);
                    this._connection.saveAppYaml(this._appJson.name, filename, appJson);
                    break;
            }
        });
    }

    _handleSaveAppYamlResult(err, commandResult) {
        if (err) {
            console.error(new Date().toString(), 'An error occurred saving app %s', this._appJson.name, err);
            throw err;
        }

        const appVersionId = commandResult.result;

        console.log(new Date().toString(), 'Successfully saved ' + this._path + ' for app ' + this._appJson.name + '. ' +
            'Got app version <<<' + appVersionId + '>>>.');
        // TODO: implement code that automatically sets this app version as the current/latest (which one?) in Dexi
        console.log(new Date().toString(), 'Requests made to this app version, e.g. from an addon or a robot, ' +
            'are sent to the app running locally on this machine on port ' + this._port + ' as long as the connection to App Proxy Server is alive')
    }

    _handleRegisterResult(err) {
        if (err) {
            console.error(new Date().toString(), 'An error occurred registering with App Proxy Server', err);
            throw err;
        }

        console.log('Local app successfully registered!\n');

        console.log('Press CTRL+C to quit.');

        console.log(new Date().toString(), 'Saving ' + this._path + ' in Dexi to create an app version that can be used for testing in Dexi...');
        this._connection.saveAppYaml(this._appJson.name, this._path, this._appJson);
    }

    /**
     *
     * @param err
     * @param {CommandRequest} commandRequest
     */
    _handleAppRequest(err, commandRequest) {
        let {request, id: requestId} = commandRequest.data;

        const appRequestOptions = {
            hostname: 'localhost', // For now, we only support localhost, which is the default
            port: this._port,
            path: request.path,
            method: request.method,
            headers: request.headers,
            body: request.body
        };

        let methodWithPath = appRequestOptions.method + ' ' + appRequestOptions.path;

        if (this._debug) {
            console.log(new Date().toString(), 'Sending request for ' + methodWithPath + '. to app.');
            console.log('\n--- REQUEST START ---');
            console.log(methodWithPath);
            Object.entries(request.headers).forEach(([name, value]) => {
                console.log('%s: %s', name, value);
            });
            console.log('');
            console.log(request.body);
            console.log('--- REQUEST END -----');
        }

        const appRequest = HTTP.request(appRequestOptions, (appResponse) => {
            var responseBody = '';
            appResponse
                .on('data', (chunk) => {
                    responseBody += chunk;
                })
                .on('error', (err) => {
                    console.error(new Date().toString(), 'Received error from app', err);
                })
                .on('end', () => {
                    if (this._debug) {

                        console.log('\n--- RESPONSE START [%s] ---', methodWithPath);
                        console.log('HTTP/1.1 %s %s', appResponse.statusCode, appResponse.statusMessage);
                        Object.entries(appResponse.headers).forEach(([name, value]) => {
                            console.log('%s: %s', name, value);
                        });
                        console.log('');
                        console.log(responseBody);
                        console.log('--- RESPONSE END -----');
                    }

                    this._connection.sendAppResponse(this._appJson.name, {
                        requestId: requestId,
                        status: appResponse.statusCode,
                        headers: Object.assign({}, appResponse.headers),
                        body: responseBody
                    });
                });
        });

        appRequest.on('error', (err) => {
            console.error(new Date().toString(), 'An error occurred sending request ' + methodWithPath + ' to app: ' + JSON.stringify(err));

            this._connection.sendAppResponse(this._appJson.name, {
                requestId: requestId,
                status: 500,
                headers: {},
                body: JSON.stringify({
                    code: 500,
                    error: true,
                    msg: err + ''
                })
            });
        });

        if (appRequestOptions.body) {
            appRequest.write(appRequestOptions.body)
        }

        appRequest.end();
    }

    _handleMessageError(err, commandResult) {
        let errorMessage;
        if (err) {
            if (err instanceof Error) {
                errorMessage = err.message;
            } else {
                errorMessage = JSON.stringify(err);
            }
        } else {
            errorMessage = commandResult.result;
        }

        if (!errorMessage) {
            errorMessage = 'Unknown error';
        }

        console.error('%s Dexi responded with an error: %s', new Date(), errorMessage);

        if (commandResult.status === CommandStatus.ERROR) {
            // TODO: add a status code field to CommandResult?
            let isServerError = commandResult.status >= 500;
            if (isServerError) {
                console.error('Server returned an error: ' + commandResult.errorMessage + '. Sending SIGINT...');
                process.emit("SIGINT");
            }
        }
    }
}

module.exports = ProxyClient;