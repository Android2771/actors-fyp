const actors = {};
const workers = {};
const remoteActors = {};
let network;

//Taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

//Taken from https://betterprogramming.pub/how-to-create-your-own-event-emitter-in-javascript-fbd5db2447c4
class MessageEmitter {
    constructor() {
        this._events = {};
    }

    on(name, listener) {
        if (!this._events[name]) {
            this._events[name] = [];
        }

        this._events[name].push(listener);
    }

    removeListener(name, listenerToRemove) {
        if (!this._events[name]) {
            throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);
        }

        const filterListeners = (listener) => listener !== listenerToRemove;

        this._events[name] = this._events[name].filter(filterListeners);
    }

    emit(name, data) {
        if (!this._events[name]) {
            throw new Error(`Can't emit an event. Event "${name}" doesn't exits.`);
        }

        const fireCallbacks = (callback) => {
            callback(data);
        };

        this._events[name].forEach(fireCallbacks);
    }
}

const messageEmitter = new MessageEmitter();
const spawnEmitter = new MessageEmitter();

//Adapted from https://stackoverflow.com/questions/7931182/reliably-detect-if-the-script-is-executing-in-a-web-worker
const isWorker = () => typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

const messageHandler = (messageJson) => {
    switch (messageJson.header) {
        case "SPAWN":
            const name = spawn(messageJson.state, messageJson.behaviour);
            const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: name, remoteActorId: messageJson.remoteActorId };
            network.send(JSON.stringify(payload));
            break;
        case "SPAWNED":
            remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
            spawnEmitter.emit(messageJson.remoteActorId);
            break;
        case "MESSAGE":
            send(messageJson.name, messageJson.message);
            break;
    }
};

export const init = (url, timeout = 0x7fffffff, numWorkers = 1, workerFile) => {
    network = new WebSocket(url);
    return new Promise((resolve, reject) => {
        setTimeout(reject, timeout);
        network.onmessage = (event) => {
            const messageJson = JSON.parse(event.data.toString());
            switch (messageJson.header) {
                case "ACK":
                    let exchanged = false;
                    
                    if (!isWorker()) {
                        for (let i = 0; i < numWorkers - 1; i++) {
                            const worker = new Worker(workerFile, {type: "module"});
                            worker.onmessage = (message) => {
                                if (exchanged)
                                    messageHandler(message);
                                else {
                                    workers[message] = worker;
                                    worker.postMessage(messageJson.sockNo);
                                    exchanged = true;
                                }
                            };
                        }
                    } else {
                        onmessage = message => {
                            if (exchanged)
                                messageHandler(message);
                            else {
                                workers[message] = 0;
                                exchanged = true;
                            }
                        };
                    }
                    break;
                case "READY":
                    if(isWorker()){
                        console.log("hi")
                        postMessage(messageJson.yourSocketNumber)
                    }         
                    resolve(messageJson);
                    break;
                default:
                    messageHandler(messageJson);
                    break;
            }
        };
    });
};

export const spawn = (state, behaviour) => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        behaviour = Function('return ' + behaviour)() : behaviour;
    let name;
    do
        name = uuidv4();
    while (actors[name]);
    const actor = { name, node: 0, state, mailbox: [] };
    actor.state['self'] = actor;
    messageEmitter.on(name, () => {
        setTimeout(() => {
            let message = actor.mailbox.shift();
            if (message !== undefined)
                cleanedBehaviour(actor.state, message, actor.name);
        }, 0)
    });
    actors[name] = actor;
    return name;
};

export const spawnRemote = (node, state, behaviour, timeout) => {
    return new Promise((resolve, reject) => {
        const name = uuidv4();
        const actor = { name, node, state, mailbox: [] };
        const payload = JSON.stringify({ header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state });
        network.send(payload);
        spawnEmitter.on(name, () => {
            if (remoteActors[name]) {
                actor.name = remoteActors[name];
                actors[actor.name] = actor;
                delete remoteActors[name];
                resolve(actor.name);
            }
        });
        setTimeout(() => reject(), timeout);
    });
};

export const send = (name, message) => {
    const actor = actors[name];
    if (actor) {
        if (actor.node === 0) {
            actor.mailbox.push(message);
            messageEmitter.emit(actor.name, {});
        }
        else {
            const payload = { header: "MESSAGE", name: actor.name, to: actor.node, message };
            if (workers[actor.node])
                if(isWorker())
                    postMessage(payload)
                else
                    workers[actor.node].postMessage(payload);
            else
                network.send(JSON.stringify(payload));
        }
    }
};
export const terminate = (name, force = false) => {
    const actor = actors[name];
    if (actor) {
        messageEmitter.removeListener(actor.name);
        if (force)
            actor.mailbox = [];
        delete actors[actor.name];
    }
};

export default { init, spawn, spawnRemote, terminate, send };