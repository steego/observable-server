"use strict";
/// <reference path="../node_modules/@types/node/index.d.ts"/>
/// <reference path="../node_modules/@types/ws/index.d.ts"/>
exports.__esModule = true;
var WebSocket = require("ws");
// import * as Common from './Common';
var rxjs_1 = require("rxjs");
var stdout = process.stdout;
var trace = function (msg) { return stdout.write(msg + '\n'); };
exports.parseMessage = function (payload) {
    var data = JSON.parse(payload);
    if (!data.name || !data.message) {
        throw new Error('Invalid message payload received: ' + payload);
    }
    return data;
};
var port = 3001;
var WebSocketServer = WebSocket.Server;
var options = {
    port: port
};
var server = new WebSocketServer(options);
server.on('connection', function (ws) {
    trace('Connection made');
    var incomingMessages = rxjs_1.Observable.create(function (observer) {
        ws.onmessage = observer.next.bind(observer);
        ws.onerror = observer.error.bind(observer);
        ws.onclose = observer.complete.bind(observer);
        // return ws.close.bind(ws);
    }).map(function (x) { return x.data; });
    var allMessages = incomingMessages.distinctUntilChanged();
    var connHeartbeat = rxjs_1.Observable.of('').concat(allMessages)
        .combineLatest(rxjs_1.Observable.interval(1000), function (x, y) { return x; })
        .distinctUntilChanged()
        .takeWhile(function (x) { return ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING; });
    connHeartbeat
        .scan(function (x, y) {
        x.push(y);
        return x;
    }, [])
        .map(function (message) { return JSON.stringify(message); })
        .subscribe(function (json) {
        ws.send(json);
        trace(json);
    });
    ws.on('message', function (message) {
        try {
            // let msg = parseMessage(message.toString());
            trace('Input: ' + message);
            // broadcast(JSON.stringify(msg));
        }
        catch (error) {
            trace('Error: ' + error);
        }
    });
    ws.on('close', function (code, reason) {
        trace('Disconnected: ' + code.toString() + ' ' + reason);
    });
    var getCtx = function (path) {
        var time = new Date();
        return {
            path: path,
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
            ws: {
                readState: ws.readyState,
                protocol: ws.protocol,
                protocolVersion: ws.protocolVersion
            },
            sample: (function (rate) { return rxjs_1.Observable.interval(rate); })
        };
    };
});
trace('Server is running on port' + port);
// tslint:disable-next-line:no-any
// let safeEval = (context: any, js: string): Observable<any> => {
//     try {
//         // tslint:disable-next-line:no-eval
//         let f = eval('(function(ctx) { return (' + js + '); })');
//         let result = f(context);
//         if (result instanceof Observable) {
//             return result;
//         } else {
//             return Observable.of(result);
//         }
//     } catch (exn) {
//         return Observable.of({ exception: exn });
//     }
// };
// function observeNext<T>(o: Observable<T>) {
//     // return o.distinctUntilChanged(); // .concat(o.take(1));
//     return Observable.create((observer: Observer<T>) => {
//         o.skip(2).subscribe(msg => {
//             observer.next(msg);
//             trace('Message' + msg);
//             observer.complete();
//         });
//         return;
//     });
// } 
