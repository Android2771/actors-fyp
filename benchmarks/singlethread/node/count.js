//Tests message delivery overhead
import actors from '../../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 100000;  //Successive messages to be sent
const rounds = 100;   //Rounds

const counterBehaviour = (state, message, self) => {
    switch(message.header){
        case "increment":
            state.i++;
        break;
        case "query":
            send(message.sender, {header: "end", counter: state.i});
            terminate(self)
        break;
    }
};

const producer = spawn({rounds}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.counter = spawn({i: 0}, counterBehaviour)
            for(let i = 0; i < N; i++){
                send(state.counter, {header: "increment"});
            }
            state.start = new Date();
            send(state.counter, {header: "query", sender: self});
        break;
        case "end":
            state.end = new Date()
            terminate(state.counter)
            const time = state.end.getTime() - state.start.getTime()
            console.log(time);
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }
});

send(producer, {header: "start"})