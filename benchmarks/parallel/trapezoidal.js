// Tests contention on mailbox (many to many)
import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send } = actors

//Number of workers
const K = 4;
const N = 1;


const wait = 0x7FFFFFFF
init('ws://localhost:8080', wait, K).then(async ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({N, K, waiting: false, results: 0, acc: 0}, async (state, message, self) => {
            if(!state.waiting){
                //Spawn worker actors
                for(let i = 0; i < state.K; i++){
                    const worker = await spawnRemote(i+2, {N: state.N, K: state.K}, (state, message, self) => {
                            const f = x => (1 / (x + 1)) * Math.sqrt(1 + Math.pow(Math.E, Math.sqrt(2 * x))) * Math.sin(Math.pow(x, 3) - 1);
                            const h = (message.b - message.a) / message.N;    
                            let s = f(message.a) + f(message.b);
    
                            for (let j = 1; j < state.N; j++)
                                s += 2 * f(message.a + j * h);
    
                            send(message.from, {output: (h / 2) * s});
                    });       
                    
                    //Load balance
                    const a = parseInt((message.b-message.a) * (i/K)) + message.a
                    const b = parseInt((message.b-message.a) * ((i+1)/K)) + message.a
                    self.remote = true;
                    send(worker, {a, b, N, from: self})
                }
                state.waiting = true
            }else{
                //React to results
                state.acc += message.output;
                if(++state.results === state.K){
                    console.log(state.acc)
                }
            }
        });

        send(benchmarker, {a: 0, b: K, N})
    }
})