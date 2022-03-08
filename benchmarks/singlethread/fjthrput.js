// Tests messaging throughput
import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 20000;  //total messages to send to each actor
const K = 10;       //total number of actors to spawn
const rounds = parseInt(process.argv.slice(2)[0]);

const benchmarker = spawn({rounds, actors: [], messagesToSend: N*K}, (state, message, self) => {

    switch(message.header){
        case "start":         
            for(let i = 0; i < K-1; i++){
                state.actors.push(spawn({i: 0, N}, (state, message, self) => {
                    if(++state.i >= N)
                        terminate(self)
                }));
            }

            //Final spawned actor replies to benchmarker
            state.actors.push(spawn({i: 0}, (state, message, self) => {
                if(++state.i >= N){
                    send(message.sender, {header: "end"});
                    terminate(self)
                }
            }));

            state.start = new Date(); 
            for(let i = 0; i < state.messagesToSend; i++)
                send(state.actors[i % K], {sender: self})            
        break;
        case "end":
            state.end = new Date()
            state.actors = []
            const time = state.end.getTime() - state.start.getTime()
            console.log(time);
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }

}
);

send(benchmarker, {header: "start"})