//Tests message delivery overhead
import actors from '../../../src/nodeactors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 10000000;  //Successive messages to be sent
const rounds = parseInt(process.argv.slice(2)[0]);   //Rounds

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
            state.start = new Date();
            state.counter = spawn({i: 0}, counterBehaviour)
            for(let i = 0; i < N; i++){
                send(state.counter, {header: "increment"});
            }
            send(state.counter, {header: "query", sender: self});
        break;
        case "end":
            terminate(state.counter)

            state.end = new Date()
            const time = state.end.getTime() - state.start.getTime()
            console.log(time);
            
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }
});

send(producer, {header: "start"})