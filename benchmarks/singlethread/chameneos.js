// Tests contention on mailbox (many to one)
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');