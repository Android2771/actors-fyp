// Tests ahead of time actor creation and destruction
import actors from '../actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 20000;  //Number of actors to spawn
const rounds = 5;

init('ws://localhost:8080', 0x7FFFFFFF, 2, './parallel/fjcreatenet.js').then(ready => {
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds}, async (state, message, self) => {
                switch(message.header){
                    case "start":
                        state.start = new Date();
                        for(let i = 0; i < N-1; i++)
                            send(await spawnRemote(2, {}, (state, message, self) => {
                                terminate(self)
                            }), {});
                
                        //Final spawned actor replies to benchmarker
                        send(await spawnRemote(2, {}, (state, message, self) => {
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
    }
});