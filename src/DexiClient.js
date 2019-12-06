const request = require('request');
const md5 = require('md5');

class DexiClient {
    constructor(url, clientInfo) {
        if (typeof url === 'object') {
            clientInfo = url;
            url = clientInfo.url;
        }

        if (!url) {
            throw new Error('Missing url for dexi client');
        }

        this._url = url;
        if (!clientInfo.accessKey) {
            clientInfo.accessKey = md5(clientInfo.accountId + clientInfo.apiKey)
        }

        this._clientInfo = clientInfo;

    }

    _getAPIHeaders() {
        return {
            'X-DexiIO-Access': this._clientInfo.accessKey,
            'X-DexiIO-Account': this._clientInfo.accountId,
            'X-DexiIO-User': this._clientInfo.userId,
            'User-Agent': 'dexictl/1.0',
            'Accept': 'application/json'
        };
    }

    _request(method, url, bodySpec) {
        const opts = {
            method,
            headers: this._getAPIHeaders(),
            url: this._url + url
        };

        if (bodySpec && bodySpec.type) {
            opts.headers['Content-Type'] = bodySpec.type;
        }

        if (bodySpec && bodySpec.value) {
            opts.body = bodySpec.value;
        }

        return new Promise((resolve, reject) => {
            request(opts, (err, response, responseBody) => {
                if (err) {
                    err.url = opts.url;
                    err.method = opts.method;
                    reject(err);
                    return;
                }

                if (response.statusCode > 399) {
                    err = new Error(`Request failed for ${opts.method} ${opts.url}: Status: ${response.statusCode}`);
                    try {
                        err.body = responseBody ? JSON.parse(responseBody) : responseBody;
                    } catch(parseErr) {
                        err.body = responseBody;
                    }

                    reject(err);
                    return;
                }

                resolve(responseBody);
            });

        });
    }

    getAppProxyUrl() {
        return this._request('GET', '/developer/proxy/url').then((json) => {
            const output = json ? JSON.parse(json) : null ;
            if (output && output.url) {
                return output.url;
            }

            throw new Error('Failed to get app proxy endpoint');
        });
    }

    pushApp(yaml) {
        return this._request('PUT', '/developer/apps/push', {
            value: yaml,
            type: 'application/yaml'
        });
    }
}

module.exports = DexiClient;