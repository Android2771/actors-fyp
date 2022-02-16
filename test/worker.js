const { spawn, remoteSpawn, terminate, send, getActor} = require('../src/actors.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', ws => {
    ws.on('message', message => {
        const messageJson = JSON.parse(message.toString())
        if("behaviour" in messageJson){
            spawn(messageJson.state, messageJson.behaviour, messageJson.name)
        }else{
            const referredActor = getActor(messageJson.name)
            send(referredActor, {from: ws, ...messageJson.message})
        }
    });
});