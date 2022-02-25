// Tests ahead of time actor creation and destruction
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 1000000;  //Number of actors to spawn
const rounds = 100;

const benchmarker = spawn({rounds, times: []}, (state, message, self) => {
        switch(message.header){
            case "start":
                state.start = new Date();
                for(let i = 0; i < N-1; i++)
                    send(spawn({}, (state, message, self) => {
                        terminate(self)
                    }), {});
        
                //Final spawned actor replies to benchmarker
                send(spawn({}, (state, message, self) => {
                    send(message.sender, {header: "end"});
                    terminate(self);
                }), {sender: self});
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

send(benchmarker, {header: "start"})