const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();
let i = 0;
module.exports = {
    spawn: (state, behaviour) => {
        const name = (i++).toString();
        const actor = { name, state, mailbox: [] };
        messageEmitter.on(name, () => {
            let message = actor.mailbox.shift();
            if (message !== undefined)
                behaviour(actor.state, message);
        });
        return actor;
    },
    terminate: (actor) => {
        messageEmitter.removeAllListeners(actor.name);
    },
    send: (actor, message) => {
        actor.mailbox.push(message);
        messageEmitter.emit(actor.name);
    }
};