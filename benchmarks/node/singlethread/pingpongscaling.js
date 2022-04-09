//Tests message passing overhead
import actors from '../../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 1000000000;   //Number of sends
const rounds = parseInt(process.argv.slice(2)[0]);    //Rounds of benchmark
let lapStart = new Date();

const pongBehaviour = (state, message, self) => {
    if(!(message.val-1 < 0))
        send(message.sender, {val: message.val-1, sender: self});
    if(message.val % 100000000 === 1){
        const lapEnd = new Date()
        console.log(lapEnd - lapStart);
        lapStart = lapEnd;
    }
};

const pingBehaviour = (state, message, self) => {
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(message.sender, {val: message.val-1, sender: self});
    }
};

const benchmarker = spawn({rounds}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.start = new Date();
            state.ping = spawn({benchmarker: self}, pingBehaviour);
            state.pong = spawn({}, pongBehaviour);
            send(state.ping, {val: N, sender: state.pong, benchmarker: self});
        break;
        case "end":
            terminate(state.ping);
            terminate(state.pong);

            state.end = new Date();
            const time = state.end.getTime() - state.start.getTime()
            
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }
});

send(benchmarker, {header: "start"})