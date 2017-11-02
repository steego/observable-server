/// <reference path="../node_modules/@types/node/index.d.ts"/>
/// <reference path="../node_modules/@types/ws/index.d.ts"/>

import * as WebSocket from 'ws';
import * as Common from './Common';

let stdout = process.stdout;

interface Message {
    name: string;
    message: string;
}

let trace = (msg: string) => stdout.write(msg + '\n');

export let parseMessage = (payload: string): Message => {
    var data = JSON.parse(payload);
    if (!data.name || !data.message) {
        throw new Error('Invalid message payload received: ' + payload);
    }
    return data;
};

let port = 3001;
let WebSocketServer = WebSocket.Server;
let options: WebSocket.ServerOptions = {
    port: port
};

let server = new WebSocketServer(options);

server.on('connection', ws => {
    trace('Connection made');

    var id = setInterval(
        () => {
            let time = new Date();
            if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
                clearInterval(id);
                trace('Cleared interval');
            } else {
                let message = {
                    message: 'Hello Becky!',
                    timestamp: time,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    cwd: process.cwd(),
                    gid: process.getgid(),
                    hrtime: process.hrtime(),
                    uptime: process.uptime,
                    version: process.version,
                    title: process.title,
                    uid: process.getuid(),
                    test: Common.Hi({})
                };
                let json = JSON.stringify(message);
                ws.send(json);
                trace('Sent message: ' + json);
            }

        },
        1000);

    ws.on('message', message => {
        try {
            let msg = parseMessage(message.toString());
            broadcast(JSON.stringify(msg));
        } catch (error) {
            trace('Error: ' + error);
        }
    });

    ws.on('close', (code, reason) => {
        trace('Disconnected: ' + code.toString()  + ' ' + reason);
    });
});

let broadcast = (data: string): void => {
    server.clients.forEach(client => {
        trace(client.url + data);
        client.send(data);
    });
};

trace('Server is running on port' + port);