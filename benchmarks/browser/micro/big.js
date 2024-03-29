// Tests contention on mailbox (many to many)
import actors from '../browseractors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 10;   //Number of actors
const P = 500000;   //Number of pings
const rounds = 5;

const sinkBehaviour = (state, message, self) => {
    if(state.received < N-1){
        state.received++;
    }else{
        send(state.benchmarker, {header: "end"})
        state.received = 0;
    }
};

const actorBehaviour = (state, message, self) => {
    switch(message.header){
        case "start":
            for(let j = 0; j < state.toSend; j++){
                send(state.actors[parseInt(Math.random()*N)], {header: "ping", from: self})
            }
            send(state.sink, {})
        break;
        case "ping":
            send(message.from, {header: "pong"})
        break;
        case "pong":
        break;
    }
}

const benchmarker = spawn({rounds, actors: []}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.start = new Date();  
            state.sink = spawn({received: 0, benchmarker}, sinkBehaviour)            
            for(let i = 0; i < N; i++){
                const actor = spawn({actors: state.actors, sink: state.sink, toSend: P}, actorBehaviour);
                state.actors.push(actor);
            }

            
            state.actors.forEach(item => {
                send(item, {header: "start"})
            })
        break;
        case "end":
            for(let i = 0; i < N; i++)
                terminate(state.actors.pop())
            terminate(state.sink)

            state.end = new Date()
            const time = state.end.getTime() - state.start.getTime()
            console.log(time);
            
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }
});

send(benchmarker, {header: "start"})
