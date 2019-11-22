const WebSocket = require('ws');
const {EventEmitter} = require('events');

const {CommandType, CommandRequest} = require('./Commands');

class Connection {
    constructor(url) {
        this._ws = new WebSocket(url);

        // To avoid adding an event handler every time we call "this._ws.on('message'...", store our own map of
        // message type -> event handler and emit events to these handlers "on incoming message".
        this._messageHandlers = new EventEmitter();

        this._ws.on('message', (message) => {
            let commandResult = JSON.parse(message);
            //console.log('Received command result', commandResult);
            // type, err, result
            this._messageHandlers.emit(commandResult.type, null, commandResult);
        });

        this._ws.on('error', (error) => {
            console.error(new Date().toString(), 'App Proxy Server responded with an error: ' + error);
        });

        this._ws.on('unexpected-response', (payload) => {
            console.error('%s App Proxy Server responded with an unexpected response: %s %s',
                new Date(), payload.res.statusCode, payload.res.statusMessage);
            process.exit(-1)
        });

        this._ws.on('close', () => {
            console.log(new Date().toString(), 'App Proxy Server closed the connection');
            process.exit();
        });
    }

    _send(commandRequest) {
        this._ws.send(JSON.stringify(commandRequest));
    }

    addMessageHandler(type, handler) {
        this._messageHandlers.on(type, handler);
    }

    /**
     *
     * @param {{accountId:string,userId:string,apiKey:string,appName:string}} clientInfo
     */
    register(clientInfo) {
        let commandRequest = new CommandRequest(CommandType.REGISTER, clientInfo);
        this._ws.on('open', () => this._send(commandRequest) );
    }

    saveAppYaml(appName, filename, appJson) {
        const data = {
            appName: appName,
            appYaml: appJson
        };

        let commandRequest = new CommandRequest(CommandType.APP_SAVE, data);
        this._send(commandRequest);
    }

    sendAppResponse(appName, appResponse) {
        const data = {
            appName: appName,
            response: appResponse
        };

        let commandRequest = new CommandRequest(CommandType.APP_RESPONSE, data);
        this._send(commandRequest);

    }

    deregister(appName) {
        const data = {
            appName: appName
        };
        let commandRequest = new CommandRequest(CommandType.DEREGISTER, data);
        
        this._send(commandRequest);
    }

    isOpen() {
        return this._ws.readyState !== 'CLOSED';
    }

    close() {
        this._ws.close();
    }

}

module.exports = Connection;
