// Tests incremental actor creation and destruction
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 5;    //fibonnachi index

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
        case 3: //Second value received from child
            send(state.parent, {value: state.buffer + message.value});
            terminate(self)
        break;
    }
}

const benchmarker = spawn({received: 0}, (state, message, self) => {
    state.received++;
    switch(state.received){
        case 1:
            send(spawn({parent: self, received: 0}, behaviour), {value: message.value});
        break;
        case 2:
            console.log(message.value)
    }
})

send(benchmarker, {value: N})