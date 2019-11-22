// This file should always be kept in sync with the version in app-proxy-server

const CommandType = {
    REGISTER: 'register',
    APP_SAVE: 'app-save',
    APP_REQUEST: 'app-request',
    APP_RESPONSE: 'app-response',
    DEREGISTER: 'deregister'
};

const CommandStatus = {
    OK: 'ok',
    ERROR: 'error'
};

class CommandRequest {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class CommandResult {
    constructor(type) {
        this.type = type;
        this.result = {};
        this.status = CommandStatus.OK;
        this.errorMessage = undefined;
    }

    setResult(result) {
        this.result = result;
    }

    setStatus(status) {
        this.status = status;
    }

    setErrorMessage(errorMessage) {
        this.errorMessage = errorMessage;
    }

}

module.exports = {
    CommandType,
    CommandStatus,
    CommandRequest,
    CommandResult
};
