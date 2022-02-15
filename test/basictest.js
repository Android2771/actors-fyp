const {spawn, terminate, send} = require('../src/actors.js');

const behaviour = (state, message) => {
    for(let i = 0; i < 10; i ++)
        console.log(state.i++)
}

let ref = spawn({i: 0}, behaviour)

send(ref, 'h')
send(ref, 'h')
send(ref, 'h')
send(ref, 'h')
send(ref, 'h')
send(ref, 'h')