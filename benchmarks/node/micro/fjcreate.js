// Tests ahead of time actor creation and destruction
import actors from '../../../src/nodeactors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = process.argv.slice(2)[1] ? parseInt(process.argv.slice(2)[1]) : 1500000;  //Number of actors to spawn
const rounds = parseInt(process.argv.slice(2)[0]);

const benchmarker = spawn({rounds}, (state, message, self) => {
        switch(message.header){
            case "start":
                state.start = new Date();
                for(let i = 0; i < N-1; i++)
                    send(spawn({}, (state, message, self) => {
                        const sint = Math.sin(37.2);
                        const res = sint * sint;
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
                console.log(time);
                
                state.rounds--;
                if(state.rounds != 0){
                    send(self, {header: "start"});
                }
            break;
        }

    }
);

send(benchmarker, {header: "start"})