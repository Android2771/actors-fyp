"use strict";
const webSocket = require('ws');
const wss = new webSocket.Server({ port: 8080 });
const connections = [];
const connectionAddresses = {};
const expectedConnections = parseInt(process.argv.slice(2)[0]);
wss.on('connection', (ws, req) => {
    const address = req.socket.remoteAddress;
    const sockNo = connections.length;
    if (connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];
    connections.push(ws);
    if (connections.length === expectedConnections) {
        connections.forEach(connection => {
            connection.send(JSON.stringify(connectionAddresses));
        });
    }
});
