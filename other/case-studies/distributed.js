import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const pingPongBehaviour = (state, message, self) => {
    send(message.replyTo, {val: message.val-1, replyTo: self});
    if(message.val-1 < 0)
        terminate(self);
    else    
        console.log(self.name, message.val);
};
init('ws://localhost:8080', 10000, 2).then(async ready => {
    if(ready.yourNetworkNumber === 1){
        const pingActorRef = await spawnRemote(2, {}, pingPongBehaviour);
        const pongActorRef = await spawnRemote(3, {}, pingPongBehaviour);
        send(pingActorRef, {replyTo: pongActorRef, val: 5});
    }
});