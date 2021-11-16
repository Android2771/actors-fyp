const WebSocket = require('ws');
const {spawn, terminate, send} = require('../../actors.js');

const spawnerSock = new WebSocket('ws://localhost:8080/', 'actor-client');
spawnerSock.on('open', () => {
    spawnerSock.send('beep')
})