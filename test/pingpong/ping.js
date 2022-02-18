const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

spawn({}, () => {
    console.log("beep!")
})

init('ws://localhost:8080')