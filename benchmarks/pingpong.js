//Tests message passing overhead

const { init, spawn, spawnRemote, terminate, send, getActor } = require('../src/actors.js');

const N = 1000000
const rounds = 5

const ping = spawn({}, (state, message) => {
    if(message.val-1 < 0){
        send(benchmark, {message: "end"})
    }else{
        send(pong, {val: message.val-1});
    }
});

const pong = spawn({}, (state, message) => {
    if(!(message.val-1 < 0))
        send(ping, {val: message.val-1});
});

const benchmarker = spawn({rounds, times: []}, (state, message) => {
    if(message.message === "start"){
        state.start = new Date();
        send(ping, {val: N});
    }else if(message.message === "end"){
        state.end = new Date()
        const time = state.end.getTime() - state.start.getTime()
        console.log(`Finished in ${time}ms`);
        state.times.push(time)
        state.rounds--;
        if(state.rounds === 0){
            const avg = state.times.reduce((a,b) => (a+b)) / state.times.length;
            console.log(`Average time: ${avg}ms`);
        }else{
            send(benchmark, {message: "start"});
        }
    }
});

send(benchmarker, {message: "start"})