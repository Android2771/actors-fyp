const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();

client.on('connectFailed', error => {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', connection => {
    console.log('WebSocket Client Connected');
    connection.on('error', error => {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', () => {
        
    });

    //Instructions to spawn an actor
    connection.on('message', message => {
        console.log(message)
    });
});

client.connect('ws://localhost:8080/', 'actor-client');