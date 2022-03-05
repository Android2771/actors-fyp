import actors from './actors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const hi = spawn({}, () => {console.log('hi')})
send(hi, {"header": "hey"})