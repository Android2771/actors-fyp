//Tests message passing overhead
const { init, spawn, spawnRemote, terminate, send} = require('../../src/actors.js');

const N = 10000000;   //Number of sends
const rounds = process.argv.slice(2)[0];    //Rounds of benchmark

const pongBehaviour = (state, message, self) => {
    if(!(message.val-1 < 0))
        send(message.sender, {val: message.val-1, sender: self});
};

const pingBehaviour = (state, message, self) => {
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(message.sender, {val: message.val-1, sender: self});
    }
};

const benchmarker = spawn({rounds, times: []}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.ping = spawn({benchmarker: self}, pingBehaviour);
            state.pong = spawn({}, pongBehaviour);
            state.start = new Date();
            send(state.ping, {val: N, sender: state.pong, benchmarker: self});
        break;
        case "end":
            state.end = new Date();
            terminate(state.ping);
            terminate(state.pong);
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