const { spawn, remoteSpawn, terminate, send, getActor } = require('../src/actors.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const worker = new WebSocket('ws://localhost:8081');

let pong;

ping = spawn({i: 0}, (state, message) => {
    console.log(message.message)
    if(state.i < 5){
        // send(pong, {message: "ping"})
        // state.i++;
        setTimeout(() => {
            send(pong, {message: "ping"})
            state.i++;
        }, 1000)    
    }
}, "ping")

worker.on('open', () => {
    pong = remoteSpawn("test", worker, {ping}, (state, message) => { 
        console.log(message.message);
        const WebSocket = require('ws');
        const coordinator = new WebSocket('ws://localhost:8080');
        const {send} = require('../src/actors.js');
        state.ping.ws = coordinator;
        coordinator.on('open', () => {           
            send(state.ping, {message: "pong"});
            coordinator.close()
        });
    });

    send(pong, {message: "ping"})
});

wss.on('connection', ws => {
    ws.on('message', message => {
        const messageJson = JSON.parse(message.toString())
        if("behaviour" in messageJson){
            spawn(messageJson.state, messageJson.behaviour, messageJson.name)
        }else{
            const referredActor = getActor(messageJson.name)
            send(referredActor, messageJson.message)
        }
    });
});