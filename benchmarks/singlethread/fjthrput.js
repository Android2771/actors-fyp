// Tests messaging throughput
import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 20000;  //total messages to send to each actor
const K = 10;       //total number of actors to spawn
const rounds = process.argv.slice(2)[0];

const benchmarker = spawn({rounds, times: [], actors: [], messagesToSend: N*K}, (state, message, self) => {

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

send(benchmarker, {header: "start"})