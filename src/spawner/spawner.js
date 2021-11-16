#!/usr/bin/env node
const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 8080 });
const http = require('http');
const { exec } = require("child_process");
const nodes = require('./nodes.json');
const spawnable = require('./node/spawnable.js')
const fs = require('fs');
const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();

wss.on('connection', ws => {
    ws.on('message', message => {
      console.log('received: %s', message);
    });
  });

//Set up environments for all nodes in nodes.json
for(const i in nodes){
    exec(`cp -r node/ ${i}/`, () => {
        fs.appendFileSync(`${i}/node.json`, JSON.stringify(nodes[i]), err => console.log(err)); 
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