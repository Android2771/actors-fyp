//Tests message passing overhead
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 1000000;   //Number of sends
const rounds = 5;    //Rounds of benchmark

const pong = spawn({}, (state, message, self) => {
    if(!(message.val-1 < 0))
        send(message.sender, {val: message.val-1, sender: self});
});

const ping = spawn({}, (state, message, self) => {
    if(message.benchmarker)
        state.benchmarker = message.benchmarker
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(message.sender, {val: message.val-1, sender: self});
    }
});

const benchmarker = spawn({rounds, times: [], ping, pong}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.start = new Date();
            send(state.ping, {val: N, sender: state.pong, benchmarker: self});
        break;
        case "end":
            state.end = new Date()
            const time = state.end.getTime() - state.start.getTime()
            console.log(`Finished in ${time}ms`);
            state.times.push(time)
            state.rounds--;
            if(state.rounds === 0){
                const avg = state.times.reduce((a,b) => (a+b)) / state.times.length;
                console.log(`Average time: ${avg}ms`);
            }else{
                send(self, {header: "start"});
            }
        break;
    }
});

send(benchmarker, {header: "start"})