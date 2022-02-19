const { init, spawn, spawnRemote, terminate, send, getActor} = require('../../src/actors.js');

init('ws://localhost:8080').then(async data => {
    const actor = await spawnRemote(1, {}, (state, message) => {console.log(message)}, 5000)
    send(actor, {message: "test"})
});