import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const pingPongBehaviour = (state, message, self) => {
    send(message.replyTo, {val: message.val-1, replyTo: self});
    if(message.val-1 < 0)
        terminate(self)
    else    
        console.log(self.name, message.val);
};

const pong = spawn({}, pingPongBehaviour);
send(spawn({}, pingPongBehaviour), {replyTo: pong, val: 5});