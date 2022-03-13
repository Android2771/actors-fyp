//Tests message passing overhead
import actors from './actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

init('ws://localhost:8080');