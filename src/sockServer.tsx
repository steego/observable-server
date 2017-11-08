/// <reference path="../node_modules/@types/node/index.d.ts"/>
/// <reference path="../node_modules/@types/ws/index.d.ts"/>

import * as WebSocket from 'ws';
// import * as Common from './Common';
import { Observable, Observer } from 'rxjs';

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

    let incomingMessages = Observable.create(
        (observer: Observer<MessageEvent>) => {
            ws.onmessage = observer.next.bind(observer);
            ws.onerror = observer.error.bind(observer);
            ws.onclose = observer.complete.bind(observer);
            // return ws.close.bind(ws);
        }
    ).map((x: MessageEvent) => x.data);

    let allMessages = incomingMessages.distinctUntilChanged();

    var connHeartbeat = Observable.of('').concat(allMessages)
        .combineLatest(Observable.interval(1000), (x, y) => x)
        .distinctUntilChanged()
        .takeWhile(x => ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING);

    connHeartbeat
        // .map(x => {

        //     let ctx = getCtx();

        //     return safeEval(ctx, x)
        //         .takeUntil(Observable.empty().delay(100).concat(allMessages).take(1)) // observeNext(allMessages))
        //         .map(r => ({ code: x, result: r }))
        //         ;
        // })
        // // .subscribe((_) => { return; });
        // .mergeAll()
        //.map(x => getCtx(x))
        .scan((x, y) => {
            x.push(y);
            return x;
        }, [])
        .map(message => JSON.stringify(message))
        .subscribe(json => {

            ws.send(json);
            trace(json);
        });

    ws.on('message', message => {
        try {
            // let msg = parseMessage(message.toString());
            trace('Input: ' + message);
            // broadcast(JSON.stringify(msg));
        } catch (error) {
            trace('Error: ' + error);
        }
    });

    ws.on('close', (code, reason) => {
        trace('Disconnected: ' + code.toString() + ' ' + reason);
    });

    let getCtx = (path: string) => {
        let time = new Date();
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
            sample: ((rate: number) => Observable.interval(rate))
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