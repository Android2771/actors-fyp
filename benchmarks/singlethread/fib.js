// Tests incremental actor creation and destruction
import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 30;    //fibonnachi index
const rounds = process.argv.slice(2)[0];

const behaviour = (state, message, self) => {
    state.received++;
    switch(state.received){
        case 1: //Initialisation
            if(message.value <= 1){
                send(state.parent, {value: message.value})
                terminate(self)
            }else{
                send(spawn({received: 0, parent: self}, behaviour), {value: message.value-1})
                send(spawn({received: 0, parent: self}, behaviour), {value: message.value-2})
            }    
        break;
        case 2: //First value received from child
            state.buffer = message.value;
        break;
        case 3: //Second value received from child
            send(state.parent, {value: state.buffer + message.value});
            terminate(self)
        break;
    }
}

const benchmarker = spawn({received: 0, times: [], rounds}, (state, message, self) => {
    state.received++;
    switch(state.received){
        case 1:
            state.start = new Date();
            send(spawn({parent: self, received: 0}, behaviour), {value: message.value});
        break;
        case 2:
            state.end = new Date();
            const time = state.end.getTime() - state.start.getTime()
            console.log(`Finished calculating fib(${N}) = ${message.value} in ${time}ms`);
            state.times.push(time)
            state.rounds--;
            if(state.rounds === 0){
                const avg = state.times.reduce((a,b) => (a+b)) / state.times.length;
                console.log(`Average time: ${avg}ms`);
            }else{
                state.received = 0;
                send(self, {value: N});
            }
    }
})

send(benchmarker, {value: N})