const { spawn, remoteSpawn, terminate, send, getActor } = require('../src/actors.js');
const WebSocket = require('ws');
const worker = new WebSocket('ws://localhost:8081');

let pong;

ping = spawn({i: 0}, (state, message) => {
    console.log(message.message)
    if(state.i < 5){
        setTimeout(() => {
            send(pong, {message: "ping"})
            state.i++;
        }, 1000)    
    }
}, "ping")

worker.on('open', () => {
    pong = remoteSpawn("test", worker, {ping}, (state, message) => { 
        console.log(message.message);
        const {send} = require('../src/actors.js');
        state.ping.ws = message.from;
        send(state.ping, {message: "pong"});
    });

    send(pong, {message: "ping"})
});

worker.on('message', message => {
    const messageJson = JSON.parse(message.toString())
    if("behaviour" in messageJson){
        spawn(messageJson.state, messageJson.behaviour, messageJson.name)
    }else{
        const referredActor = getActor(messageJson.name)
        send(referredActor, messageJson.message)
    }
});