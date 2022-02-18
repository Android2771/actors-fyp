const { init, spawn, spawnRemote, terminate, send, getActor} = require('../../src/actors.js');

init('ws://localhost:8080').then(data => {
    const dummyActor = {name: '2', node: 1}
    send(dummyActor, {message: "test"})
});