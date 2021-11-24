#!/usr/bin/env node
const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8080 });
const { exec } = require("child_process");
const nodes = require('./nodes.json');
const fs = require('fs');

//Set up websocket ports for local nodes
let peers = {};
let connectedPeers = 0;
let portOffset = 8080
for(const i in nodes)
    peers[i] = ++portOffset;

wss.on('connection', (ws, req) => {
    const nodeName = req.url.split('id=')[1]
    ws.on('message', message => {
        console.log(`Node ${nodeName}: ${message}`);

        if(message.toString() === 'initialized'){
            connectedPeers++;
            if(Object.keys(peers).length === connectedPeers){
                wss.clients.forEach(client => {
                    client.send('connect');
                });
            }
        }
    });    
});

//Set up environments for all nodes in nodes.json
for(const i in nodes){
    exec(`cp -r node/ ${i}/`, () => {
        clientJson = {
            'name': i, 
            'behaviour': nodes[i],
            peers
        }        
        
        fs.appendFileSync(`${i}/node.json`, JSON.stringify(clientJson), err => console.log(err)); 
        // exec(`node ${i}/client.js &`)
    })    
}

//Tear down environments for all nodes on exit
process.on('SIGINT', code => {
    for(const i in nodes){
        exec(`rm -rf ${i}/`)
    }
    process.exit(0)
})