//Tests message sending and context switching bewteen actors
const { init, spawn, spawnRemote, terminate, send} = require('../../src/actors.js');

const N = 10;       //Connected actors
const H = 1000000;  //Number of hops
const rounds = 10;   //Rounds

const actorBehaviour = (state, message, self) => {
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(state.actors[(state.i+1)%N], {val: message.val-1});
    }
};

const benchmarker = spawn({rounds, times: [], actors: []}, (state, message, self) => {
    switch(message.header){
        case "start":
            for(let i = 0; i < N; i++){
                const actor = spawn({actors: state.actors, i, benchmarker}, actorBehaviour);            
                state.actors.push(actor);
            }
            state.start = new Date();
            send(state.actors[0], {val: H});
        break;
        case "end":
            state.end = new Date()
            for(let i = 0; i < N; i++)
                terminate(state.actors.pop());
            
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