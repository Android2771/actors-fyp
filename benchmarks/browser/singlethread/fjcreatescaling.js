// Tests ahead of time actor creation and destruction
import actors from '../actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 1000000000;  //Number of actors to spawn
let lapStart = new Date();

const benchmarker = spawn({rounds}, (state, message, self) => {
        state.start = new Date();
        for(let i = 0; i < N; i++){
            console.log(i)
            if(N % i === 100000000 && i !== N){
                const lapEnd = new Date()
                console.log(lapEnd - lapStart);
                lapStart = lapEnd;
            }

            send(spawn({}, (state, message, self) => {
                terminate(self)
            }), {});
        }
    }
);

send(benchmarker, {header: "start"})