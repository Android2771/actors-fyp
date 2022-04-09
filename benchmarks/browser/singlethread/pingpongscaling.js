//Tests message passing overhead
import actors from '../actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 1000000000;   //Number of sends
let lapStart = new Date();

const pongBehaviour = (state, message, self) => {
    if(!(--message.val < 0))
        send(message.sender, {val: message.val-1, sender: self});
    if(message.val % 100000000 === 0){
        const lapEnd = new Date()
        console.log(lapEnd - lapStart);
        lapStart = lapEnd;
    }
};

const pingBehaviour = (state, message, self) => {
    if(--message.val < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(message.sender, {val: message.val-1, sender: self});
    }
};

const benchmarker = spawn({rounds}, (state, message, self) => {
    state.ping = spawn({benchmarker: self}, pingBehaviour);
    state.pong = spawn({}, pongBehaviour);
    send(state.ping, {val: N, sender: state.pong, benchmarker: self});
});

send(benchmarker, {header: "start"})