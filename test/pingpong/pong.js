const { init, spawn, remoteSpawn, terminate, send, getActor} = require('../../src/actors.js');

init('ws://localhost:8080').then(data => {
    const dummyActor = {name: '0', node: 1}
    send(dummyActor, {message: "test"})
});