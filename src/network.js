"use strict";
const NetworkWebSocket = require('ws');
const wss = new NetworkWebSocket.Server({ port: 8080 });
const connections = [];
const connectionAddresses = {};
const expectedConnections = parseInt(process.argv.slice(2)[0]);
wss.on('connection', (ws, req) => {
    connections.push(ws);
    console.log(`Accepted ${connections.length}`);
    const address = req.socket.remoteAddress;
    const sockNo = connections.length;
    if (connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];
    if (connections.length === expectedConnections) {
        for (let i = 0; i < connections.length; i++) {
            connections[i].send(JSON.stringify({ "header": "READY", connectionAddresses, yourSocketNumber: i + 1 }));
            connections[i].on('message', (message) => {
                const messageJson = JSON.parse(message.toString());
                connections[messageJson.to - 1].send(JSON.stringify(Object.assign({ from: i + 1 }, messageJson)));
            });
        }
    }
});
