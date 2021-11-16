#!/usr/bin/env node
const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8080 });
const { exec } = require("child_process");
const nodes = require('./nodes.json');
const fs = require('fs');

wss.on('connection', (ws, req) => {
    const nodeName = req.url.split('id=')[1]
    ws.on('message', message => {
      console.log(`Node ${nodeName}: ${message}`);
    });
  });

//Set up environments for all nodes in nodes.json
for(const i in nodes){
    exec(`cp -r node/ ${i}/`, () => {
        fs.appendFileSync(`${i}/node.json`, JSON.stringify({'name': i, 'behaviour': nodes[i]}), err => console.log(err)); 
        exec(`node ${i}/client.js &`)
    })    
}

//Tear down environments for all nodes on exit
process.on('SIGINT', code => {
    for(const i in nodes){
        exec(`rm -rf ${i}/`)
    }
    process.exit(0)
})