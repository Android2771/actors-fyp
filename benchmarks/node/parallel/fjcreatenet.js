// Tests ahead of time actor creation and destruction
import actors from '../../../src/nodeactors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection} = actors

const N = 100000;  //Number of actors to spawn
const rounds = 5;

// init('ws://localhost:8080').then(ready => {                  //WebSocket
init('ws://localhost:8080', 0x7FFFFFFF, 1).then(ready => {      //Cluster
    if (ready.yourNetworkNumber === 1) {
        const benchmarker = spawn({rounds}, async (state, message, self) => {
                switch(message.header){
                    case "start":
                        state.start = new Date();

                        for(let i = 0; i < N; i++)
                            await spawnRemote(2, {}, (state, message, self) => {})

                        state.end = new Date()
                        const time = state.end.getTime() - state.start.getTime()
                        console.log(time);
                        
                        state.rounds--;
                        if(state.rounds != 0)
                            send(self, {header: "start"});
                        else
                            closeConnection()
                    break;
                }

            }
        );

        send(benchmarker, {header: "start"})
    }
});