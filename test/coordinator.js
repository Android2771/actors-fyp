const { spawn, remoteSpawn, terminate, send, getActor } = require('../src/actors.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const worker = new WebSocket('ws://localhost:8081');

ping = spawn({}, (state, behaviour) => {
    console.log("ping")
}, "ping")

worker.on('open', () => {
    const actor = remoteSpawn("test", worker, {}, (state, message) => { 
        const WebSocket = require('ws');
        let coordinator = new WebSocket('ws://localhost:8080');

        coordinator.on('open', () => {                       
            coordinator.send("testing")
        })
    });

    send(actor, {message: "ping"})
});

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(message.toString())
    });
});