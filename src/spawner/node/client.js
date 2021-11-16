const WebSocket = require('ws');
const {spawn, terminate, send} = require('../../actors.js');
const node = require('./node.json');

//Init connection actor
let init = spawn({}, (state, message) => {
    //Open up connection with spawner for output
    const spawnerSock = new WebSocket(`ws://localhost:8080/?id=${Object.keys(node)[0]}`);
    spawnerSock.on('open', () => {
        send(main, {spawnerSock})
        terminate(init)
    })
})

//Main function spawns 
let main = spawn({}, (state, message) => {
    message.spawnerSock.send('hi')
})

//Start process
send(init, {})