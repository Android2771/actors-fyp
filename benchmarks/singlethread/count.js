//Tests message delivery overhead
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 100000;  //Successive messages to be sent
const rounds = 5;   //Rounds

const counter = spawn({i: 0}, (state, message, self) => {
    switch(message.header){
        case "increment":
            state.i++;
        break;
        case "query":
            send(message.sender, {header: "query", counter: state.i});
            state.i = 0;
        break;
    }
});

const producer = spawn({rounds, times: [], counter}, (state, message, self) => {
    switch(message.header){
        case "start":
            state.start = new Date();
            for(let i = 0; i < N; i++){
                send(state.counter, {header: "increment"});
            }
            send(state.counter, {header: "query", sender: self});
        break;
        case "query":
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
});

send(producer, {header: "start"})