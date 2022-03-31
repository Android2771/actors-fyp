import uuidv4 from './uuid/v4.js';

const actors = {};
let workers = {};
const remoteActors = {};
let primary = 0;
let yourNetworkNumber = 0;
let network;

const events = {};

const on = (name , listener) => {
    events[name] = listener;
}

const removeListener = (name) => {
    delete events[name];
}

const emit = (name) => {
    if(events[name])
        events[name]();
}

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
            emit(messageJson.remoteActorId)
            break;
        case "MESSAGE":
            //A message addressed to a node that needs to be locally forwarded
            send(messageJson.actor, messageJson.message)
            break;
    }
};

const init = (url, timeout = 0x7fffffff, numWorkers = 0, file) => {
    const error = new Error();
    //Get the file name on the caller to spawn the web worker there
    const workerFile = file ?? error.stack.split('\n')[2].match(/[^\/]*\.js/gm)[0]
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
                                        for (let id in workers) {
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

    let name;
    do
        name = uuidv4();
    while (actors[name]);

    const actor = { name, node: yourNetworkNumber, state, behaviour: cleanedBehaviour, active: true };
    actors[name] = actor;

    return { name: actor.name, node: actor.node };
};

const spawnRemote = (node, state, behaviour, timeout = 0x7fffffff) => {
    return new Promise((resolve, reject) => {
        const name = uuidv4();
        const payload = { header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state };
        forward(payload);
        on(name, () => {
            if (remoteActors[name]) {
                resolve({ name: remoteActors[name], node })
            }
        });
        setTimeout(() => reject(), timeout);
    });
};

const send = (actor, message) => {
    if (actor.node === yourNetworkNumber) {
        const localActor = actors[actor.name];

        if (localActor) {
            Promise.resolve().then(() => {
                if (message !== undefined && localActor.active)
                    localActor.behaviour(localActor.state, message, { name: localActor.name, node: localActor.node });
            });
        }
    }
    else {
        const payload = { header: "MESSAGE", actor, to: actor.node, message };
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
        removeListener(localActor.name)
        localActor.active = !force;
        delete actors[actor.name];
    }
};

export default { init, spawn, spawnRemote, terminate, send, closeConnection };