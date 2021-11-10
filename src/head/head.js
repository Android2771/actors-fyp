#!/usr/bin/env node
const WebSocketServer = require('websocket').server;
const http = require('http');
const { exec } = require("child_process");
const locations = require('./locations.json');
const spawnable = require('./client/spawnable.js')
const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
const port = '8080'
server.listen(port, function() {
    console.log((new Date()) + ` Server is listening on port ${port}`);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

let connections = []

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    let connection = request.accept('actor-client', request.origin);
    connections.push(connection)
    
    console.log((new Date()) + ' Connection accepted.');
    if(connections.length == locations.length)
        messageEmitter.emit('setup-done')

    connection.on('message', message => {
        
    });

    connection.on('close', (reasonCode, description) => {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

//Set up environments for all nodes in locations.json
locations.forEach(location => {
    exec(`cp -r client/ ${location}`)
    exec(`node ${location}/client.js &`)
})

//Tear down environments for all nodes on exit
process.on('SIGINT', code => {
    locations.forEach(location => {
        exec(`rm -rf ${location}/`)
    })
    process.exit(0)
})

//Once all connections are made, 
messageEmitter.once('setup-done', () => {
    //Put master code here
});
