"use strict";
const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {
}
const messageEmitter = new MessageEmitter();
let i = 0;
let actors = {};
const getActor = (name) => {
    return actors.name;
};
module.exports = {
    spawn: (state, behaviour, actorName = "") => {
        const name = actorName ? actorName : (i++).toString();
        if (getActor(name))
            return { name: '', ws: null, state: {}, mailbox: [] };
        const actor = { name, ws: null, state, mailbox: [] };
        messageEmitter.on(name, () => {
            let message = actor.mailbox.shift();
            if (message !== undefined)
                if (typeof behaviour === "string")
                    eval(`(${behaviour})(${JSON.stringify(actor.state)}, ${JSON.stringify(message)})`);
                else
                    behaviour(actor.state, message);
        });
        actors['name'] = actor;
        return actor;
    },
    remoteSpawn: (name, ws, state, behaviour) => {
        const actor = { name, ws, state, mailbox: [] };
        ws.send(JSON.stringify({ name, behaviour: behaviour.toString().replace(/ |\n/g, ''), state }));
        return actor;
    },
    terminate: (actor) => {
        messageEmitter.removeAllListeners(actor.name);
    },
    send: (actor, message) => {
        if (actor.ws !== null) {
            actor.ws.send(JSON.stringify({ name: actor.name, message }));
        }
        else {
            actor.mailbox.push(message);
            messageEmitter.emit(actor.name);
        }
    },
    getActor
};
