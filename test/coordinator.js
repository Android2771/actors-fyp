const { spawn, remoteSpawn, terminate, send } = require('../src/actors.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let worker;

wss.on('connection', ws => {
    worker = new WebSocket('ws://localhost:8081');
    worker.on('open', () => {
        const actor = remoteSpawn("test", worker, {}, () => {
            console.log("yo")
        });

        send(actor, {message: "yo"})
    });

    ws.on('message', message => {
        messageJson = JSON.parse(message.toString())
        if("behaviour" in messageJson){
            console.log("Remote spawn received!")
        }else{
            console.log("Message received!")
        }
    });
});