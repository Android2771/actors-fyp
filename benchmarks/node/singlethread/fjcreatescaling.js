// Tests ahead of time actor creation and destruction
import actors from '../../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 8000000;  //Number of actors to spawn
let lapStart = new Date();

const benchmarker = spawn({}, (state, message, self) => {
        state.start = new Date();
        for(let i = 0; i < N; i++){
            if(i % (N/10) === 0 && i !== 0){
                const lapEnd = new Date()
                console.log(lapEnd - lapStart);
                lapStart = lapEnd;
            }

            const actor = spawn({}, (state, message, self) => {});
            // terminate(actor)
        }
    }
);

send(benchmarker, {header: "start"})