import actors from './actors.js';
const { init, spawn, spawnRemote, terminate, send } = actors

const wait = 0x7FFFFFFF
init('ws://localhost:8080', wait, 2, './index.js').then(async ready => {
    switch(ready.yourNetworkNumber){
        case 1:
            const ping = await spawnRemote(2, {}, () => {console.log("ping")}, wait)
            send(ping, {})
        break;
        case 2:
            const pong = await spawnRemote(1, {}, () => {console.log("pong")}, wait)
            send(pong, {})
        break;
    }
})