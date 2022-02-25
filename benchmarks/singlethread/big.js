// Tests contention on mailbox (many to many)
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');