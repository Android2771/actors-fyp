const WebSocket = require('ws');
const network = new WebSocket('ws://localhost:8080');

network.on('message', message => {
    const messageJson = JSON.parse(message.toString())
    console.log(messageJson);
});