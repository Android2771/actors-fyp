//Tests message passing overhead
import actors from './actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors
const pingPongBehaviour = (state, message, self) => {
    console.log(message.val);
    if(!(message.val-1 < 0))
        send(message.replyTo, {val: message.val-1, replyTo: self});
};
//Specify timeout and number of workers to spawn
init('ws://localhost:8080', 100000, 2).then(async ready => {
    //The primary node is always 1
    if(ready.yourNetworkNumber === 1){
        const ping = await spawnRemote(2, {}, pingPongBehaviour);
        const pong = await spawnRemote(3, {}, pingPongBehaviour);

        //Send ping a message. Output will be decrementing values from 5 to 0
        send(ping, {replyTo: pong, val: 5})
    }
});