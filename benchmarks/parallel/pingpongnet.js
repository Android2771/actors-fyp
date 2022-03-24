//Tests message passing overhead
import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 10000;   //Number of sends
const rounds = 1000;    //Rounds of benchmark

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

init('ws://localhost:8080').then(ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds}, async (state, message, self) => {
            switch(message.header){
                case "start":
                    state.ping = await spawnRemote(2, {benchmarker: self}, pingBehaviour);
                    state.pong = await spawnRemote(3, {}, pongBehaviour);
                    state.start = new Date();
                    send(state.ping, {val: N, sender: state.pong, benchmarker: self});
                break;
                case "end":
                    state.end = new Date();
                    terminate(state.ping);
                    terminate(state.pong);
                    const time = state.end.getTime() - state.start.getTime()
                    console.log(time);
                    state.rounds--;
                    if(state.rounds != 0)
                        send(self, {header: "start"})
                break;
            }
        });
        send(benchmarker, {header: "start"})
    }    
});
