// Tests contention on mailbox (many to many)
const { init, spawn, spawnRemote, terminate, send} = require('../../src/actors.js');

const N = 10;   //Number of actors
const P = 30000;   //Number of pings
const rounds = process.argv.slice(2)[0];

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

const benchmarker = spawn({rounds, times: [], actors: []}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.sink = spawn({received: 0, benchmarker}, sinkBehaviour)            
            for(let i = 0; i < N; i++){
                const actor = spawn({actors: state.actors, sink: state.sink, toSend: P}, actorBehaviour);
                state.actors.push(actor);
            }

            state.start = new Date();  
            
            state.actors.forEach(item => {
                send(item, {header: "start"})
            })
        break;
        case "end":
            state.end = new Date()
            const time = state.end.getTime() - state.start.getTime()
            for(let i = 0; i < N; i++)
                terminate(state.actors.pop())
            terminate(state.sink)
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
