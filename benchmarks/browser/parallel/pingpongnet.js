//Tests message passing overhead
import actors from '../../actors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection} = actors

const N = 100000;   //Number of sends
const rounds = 5;    //Rounds of benchmark

const pongBehaviour = (state, message, self) => {
    if(!(message.val-1 < 0))
        send(message.sender, {val: message.val-1, sender: self});
};

const pingBehaviour = (state, message, self) => {
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"});
    }else{
        send(message.sender, {val: message.val-1, sender: self});
    }
};

init('ws://localhost:8080', 0x7FFFFFFF, 1, './parallel/pingpongnet.js').then(ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds}, async (state, message, self) => {
            switch(message.header){
                case "start":                    
                    state.ping = spawn({benchmarker: self}, pingBehaviour);
                    state.pong = await spawnRemote(2, {}, pongBehaviour);
                    send(state.ping, {val: N, sender: state.pong, benchmarker: self});
                    state.start = new Date();
                break;
                case "end":
                    state.end = new Date();
                    terminate(state.ping);
                    terminate(state.pong);
                    const time = state.end.getTime() - state.start.getTime()
                    console.log(time);
                    state.rounds--;
                    if(state.rounds != 0)
                        send(self, {header: "start"});
                    else
                        closeConnection()
                break;
            }
        });
        send(benchmarker, {header: "start"})
    }    
});
