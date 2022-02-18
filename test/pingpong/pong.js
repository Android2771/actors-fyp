const { init, spawn, remoteSpawn, terminate, send, getActor} = require('../../src/actors.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

init('ws://localhost:8080')