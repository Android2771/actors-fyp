// Tests contention on mailbox (many to many)
import process from 'process';
import actors from '../../../src/nodeactors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection } = actors

//Number of workers
const K = parseInt(parseInt(process.argv.slice(2)[0]));
const rounds = parseInt(process.argv.slice(2)[1]);
const N = 200000000;

const wait = 0x7FFFFFFF
init('ws://localhost:8080', wait, K).then(ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds, N, K, results: 0, acc: 0, waiting: false}, (state, message, self) => {
            if(!state.waiting){
                state.start = new Date();  
                //Spawn worker actors
                for(let i = 0; i < state.K; i++){
                    spawnRemote(i+2, {}, (state, message, self) => {
                            let output = 0;
                            for(let j = message.a; j <= message.b; j++)
                                output += (4/(8*j+1)-2/(8*j+4)-1/(8*j+5)-1/(8*j+6))*Math.pow(1/16, j);
                            send(message.from, {output});
                    }).then(worker => {                    
                        //Load balance
                        const a = parseInt(state.N * (i/K));
                        const b = parseInt(state.N * ((i+1)/K))+1;
                        send(worker, {a, b, from: self});
                    })       
                }
                state.waiting = true
            }else{
                //React to results
                state.acc += message.output;
                if(++state.results === state.K){
                    state.end = new Date()
                    const time = state.end.getTime() - state.start.getTime()
                    console.log(time)
                    state.results = 0
                    state.waiting = false
                    state.acc = 0
                    if(--state.rounds != 0)
                        send(self, {})
                    else
                        closeConnection()
                }
            }
        });
        
        send(benchmarker, {})
    }
});