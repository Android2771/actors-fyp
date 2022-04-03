// Tests contention on mailbox (many to many)
import actors from '../actors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection } = actors

//Number of workers
const K = 4;
const rounds = 5;
const N = 100000000;

const wait = 0x7FFFFFFF
init('ws://localhost:8080', wait, K, './parallel/trapezoid.js').then(ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds, N, K, results: 0, acc: 0, waiting: false}, (state, message, self) => {
            if(!state.waiting){
                state.start = new Date();  
                //Spawn worker actors
                for(let i = 0; i < state.K; i++){
                    spawnRemote(i+2, {}, (state, message, self) => {
                            const f = x => (1 / (x + 1)) * Math.sqrt(1 + Math.pow(Math.E, Math.sqrt(2 * x))) * Math.sin(Math.pow(x, 3) - 1);
                            const h = (message.b - message.a) / message.N;    
                            let s = f(message.a) + f(message.b);
    
                            for (let j = 1; j < message.N; j++)
                                s += 2 * f(message.a + j * h);
    
                            const output = (h/2) * s;
                            send(message.from, {output});
                    }).then(worker => {                    
                        //Load balance
                        const a = parseInt((message.b-message.a) * (i/K)) + message.a;
                        const b = parseInt((message.b-message.a) * ((i+1)/K)) + message.a;
                        send(worker, {a, b, N: state.N/state.K, from: self});
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
                        send(self, {a: 0, b: 32})
                    else
                        closeConnection()
                }
            }
        });
        
        send(benchmarker, {a: 0, b: 32})
    }
})