// Tests messaging throughput
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 20000;  //total messages to send to each actor
const K = 10;       //total number of actors to spawn
const rounds = 10;
const actors = []

const benchmarker = spawn({rounds, times: [], actors, messagesToSend: N*K}, (state, message, self) => {

    switch(message.header){
        case "start":
            state.start = new Date();
            for(let i = 0; i < state.messagesToSend; i++){
                send(state.actors[i % K], {sender: self})
            }
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

}
);

for(let i = 0; i < K-1; i++){
    const actor = spawn({i: 0, N}, (state, message, self) => {
        if(++state.i >= N)
            state.i = 0
    });
    actors.push(actor)
}


//Final spawned actor replies to benchmarker
const actor = spawn({i: 0}, (state, message, self) => {
    if(++state.i >= N){
        send(message.sender, {header: "end"});
        state.i = 0
    }
});
actors.push(actor)

send(benchmarker, {header: "start"})