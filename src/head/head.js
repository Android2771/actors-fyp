#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
const { exec } = require("child_process");
var locations = require('./locations.json');
const spawnable = require('./spawnable.js')

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

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    let connection = request.accept('actor-client', request.origin);
    console.log((new Date()) + ' Connection accepted.');

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