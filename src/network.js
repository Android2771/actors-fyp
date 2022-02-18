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
            connection.send(JSON.stringify({ "header": "READY", connectionAddresses }));
        });
    }
    ws.on('message', (message) => {
        const messageJson = JSON.parse(message.toString());
        if (!("to" in messageJson && "message" in messageJson)) {
            ws.send(JSON.stringify({ "header": "ERROR", message: "Invalid message" }));
        }
        else {
            const toSend = messageJson.message;
            connections[messageJson.to].send(JSON.stringify({ "header": "MESSAGE", message: toSend }));
        }
    });
});
