//Tests message sending and context switching bewteen actors
import actors from '../../../src/nodeactors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 10;       //Connected actors
const H = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 100000000;  //Number of hops
const rounds = parseInt(process.argv.slice(2)[0]);   //Rounds

const actorBehaviour = (state, message, self) => {
    if(message.val-1 < 0){
        send(state.benchmarker, {header: "end"})
    }else{
        send(state.actors[(state.i+1)%N], {val: message.val-1});
    }
};

const benchmarker = spawn({rounds, actors: []}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.start = new Date();
            for(let i = 0; i < N; i++){
                const actor = spawn({actors: state.actors, i, benchmarker}, actorBehaviour);            
                state.actors.push(actor);
            }
            send(state.actors[0], {val: H});
        break;
        case "end":
            for(let i = 0; i < N; i++)
                terminate(state.actors.pop());
            
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