const actors = {};
let workers = {};
const remoteActors = {};
let primary = 0;
let yourNetworkNumber = 0;
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
            //The spawn message is received when a spawn request is sent
            const actor = spawn(messageJson.state, messageJson.behaviour)
            const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: actor.name, remoteActorId: messageJson.remoteActorId }
            forward(payload)
            break;
        case "SPAWNED":
            //The spawned message is received as an acknowledgement by the remote node
            //The message includes the name of the remote node so that it can be uniquely identified
            remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
            spawnEmitter.emit(messageJson.remoteActorId)
            break;
        case "MESSAGE":
            //A message addressed to a node that needs to be locally forwarded
            send(messageJson.actor, messageJson.message)
            break;
    }
};

const init = (url, timeout = 0x7fffffff, numWorkers = 0) => {
    const error = new Error();
    //Get the file name on the caller to spawn the web worker there
    const workerFile = error.stack.split('\n')[2].match(/[^\/]*\.js/gm)[0]
    network = new WebSocket(url);
    let readyMessage;

    return new Promise((resolve, reject) => {
        setTimeout(reject, timeout);
        network.onmessage = event => {
            const messageJson = JSON.parse(event.data);
            switch (messageJson.header) {
                case "ACK":
                    let exchanged = false;

                    if (!isWorker()) {
                        for (let i = 0; i < numWorkers; i++) {
                            const worker = new Worker(workerFile, { type: "module" });
                            worker.onmessage = event => {
                                const message = event.data;
                                if (exchanged)
                                    if (message.to === messageJson.yourNetworkNumber)
                                        messageHandler(message);
                                    else
                                        forward(message);
                                else {
                                    workers[message] = worker;        
                                    if (Object.keys(workers).length === numWorkers) {  
                                        //When all workers are connected, send payload of neighbour cluster nodes
                                        const payload = { primary: messageJson.yourNetworkNumber, workers: Object.keys(workers) }
                                        for (let id in workers){
                                            workers[id].postMessage(payload)
                                        }

                                        exchanged = true;
                                        resolve(readyMessage)
                                    }
                                }
                            };
                        }
                    } else {
                        onmessage = event => {
                            const message = event.data
                            if (exchanged)
                                messageHandler(message);
                            else {
                                primary = message.primary;
                                workers = message.workers;
                                exchanged = true;
                                resolve(readyMessage)
                            }
                        };
                    }
                    break;
                case "READY":
                    yourNetworkNumber = messageJson.yourNetworkNumber;
                    if (isWorker()) 
                        postMessage(messageJson.yourNetworkNumber)                    

                    if (numWorkers === 0)
                        resolve(messageJson);
                    else
                        readyMessage = messageJson;
                    break;
                default:
                    messageHandler(messageJson);
                    break;
            }
        };
    });
};

const closeConnection = () => {
    network.close();
}

const spawn = (state, behaviour) => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        behaviour = Function('init', 'spawn', 'spawnRemote', 'terminate', 'send', 'return ' + behaviour)(init, spawn, spawnRemote, terminate, send) : behaviour;
    
    let name 
    do
        name = uuidv4();
    while(actors[name])

    const actor = { name, node: yourNetworkNumber, state, mailbox: [] };

    messageEmitter.on(name, () => {
        Promise.resolve().then(() => {
            const message = actor.mailbox.shift();
            if (message !== undefined)
                cleanedBehaviour(actor.state, message, {name: actor.name, node: actor.node});
        }, 0)
    });

    actors[name] = actor;

    return { name: actor.name, node: actor.node};
};

const spawnRemote = (node, state, behaviour, timeout) => {
    return new Promise((resolve, reject) => {
        const name = uuidv4();
        const payload = { header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state };
        forward(payload);
        spawnEmitter.on(name, () => {
            if (remoteActors[name]) {
                resolve({ name: remoteActors[name], node})
            }
        });
        setTimeout(() => reject(), timeout);
    });
};

const send = (actor, message) => {
    if (actor.node === yourNetworkNumber) {
        const localActor = actors[actor.name]
        //Local send
        if(localActor){
            localActor.mailbox.push(message);
            messageEmitter.emit(actor.name);
        }
    } else {
        //Create network payload
        const payload = { header: "MESSAGE", actor, to: actor.node, message }
        forward(payload);
    }
};

const forward = (payload) => {
    const modifiedPayload = Object.assign({ from: yourNetworkNumber }, payload);
    if ((Array.isArray(workers) && workers.includes(payload.to)) || workers[payload.to] || payload.to === primary)
        if (!isWorker())
            workers[payload.to].postMessage(modifiedPayload);
        else
            postMessage(modifiedPayload);
    else
        network.send(JSON.stringify(modifiedPayload));
};

const terminate = (actor, force = false) => {
    const localActor = actors[actor.name];
    if (localActor) {
        messageEmitter.removeListener(actor.name);
        if (force)
        localActor.mailbox = []
        delete actors[actor.name]
    }
};

export default { init, spawn, spawnRemote, terminate, send, closeConnection };