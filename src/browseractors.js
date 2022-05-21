import uuidv4 from './uuid/v4.js';

const actors = {};
let workers = {};
const remoteActors = {};
let primary = 0;
let yourNetworkNumber = 0;
let network;

const events = {};

const on = (name, listener) => {
    events[name] = listener;
}

const removeListener = (name) => {
    delete events[name];
}

const emit = (name) => {
    if (events[name])
        events[name]();
}

//Adapted from https://stackoverflow.com/questions/7931182/reliably-detect-if-the-script-is-executing-in-a-web-worker
const isWorker = () => typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

const messageHandler = (messageJson) => {
    switch (messageJson.header) {
        case "SPAWN":
            //The spawn message is received when a spawn request is sent
            const actor = spawn(messageJson.state, messageJson.behaviour);
            const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: actor.name, remoteActorId: messageJson.remoteActorId };
            forward(payload);
            break;
        case "SPAWNED":
            //The spawned message is received as an acknowledgement by the remote node
            //The message includes the name of the remote node so that it can be uniquely identified
            remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
            emit(messageJson.remoteActorId);
            break;
        case "MESSAGE":
            //A message addressed to a node that needs to be locally forwarded
            send(messageJson.actor, messageJson.message);
            break;
    }
};

/**
 * Establishes the connection with a WebSocket server which links other nodes hosting actors with an optional number of spawned cluster nodes
 * @param url The url to the WebSocket server
 * @param timeout The amount of time to wait for the server to allow for communication with other nodes
 * @param numWorkers The number of cluster nodes to spawn each of which will establish a connection with the server
 * @returns
 */
const init = (url, timeout = 0x7fffffff, numWorkers = 0, file) => {
    const error = new Error();
    //Get the file name on the caller to spawn the web worker
    const workerFile = file ?? error.stack.split('\n')[2].match(/[^\/]*\.js/gm)[0];
    network = new WebSocket(url);
    let readyMessage;

    //Handle incoming messages
    return new Promise((resolve, reject) => {
        setTimeout(reject, timeout);
        network.onmessage = event => {
            const messageJson = JSON.parse(event.data);
            switch (messageJson.header) {
                case "ACK": //The acknowledgement sent from the server when receiving a request
                    let exchanged = false;
                    if (!isWorker()) {
                        //Primary node will fork workers
                        for (let i = 0; i < numWorkers; i++) {
                            const worker = new Worker(workerFile, { type: "module" });
                            worker.onmessage = event => {
                                const message = event.data;
                                if (exchanged)
                                    //Check if recipient of message is primary, if so handle
                                    if (message.to === messageJson.yourNetworkNumber)
                                        messageHandler(message);
                                    else
                                        //Forward message to respective worker node
                                        forward(message);
                                else {
                                    //Put worker object in array
                                    workers[message] = worker;
                                    if (Object.keys(workers).length === numWorkers) {
                                        //When all workers are connected, send payload of neighbour cluster nodes
                                        const payload = { primary: messageJson.yourNetworkNumber, workers: Object.keys(workers) };
                                        for (let id in workers) {
                                            workers[id].postMessage(payload);
                                        }

                                        exchanged = true;
                                        resolve(readyMessage);
                                    }
                                }
                            };
                        }
                    } else {
                        onmessage = event => {
                            const message = event.data;
                            if (exchanged)
                                messageHandler(message);
                            else {
                                primary = message.primary;
                                workers = message.workers;
                                exchanged = true;
                                resolve(readyMessage);
                            }
                        };
                    }
                    break;
                case "READY":
                    yourNetworkNumber = messageJson.yourNetworkNumber;
                    //The ready message is received by the network when all nodes connected
                    if (isWorker())
                        postMessage(messageJson.yourNetworkNumber);

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

/**
 * Closes the connection
 */
const closeConnection = () => {
    network.close();
}

/**
 * Spawns a local actor
 * @param state The initial state of the actor
 * @param behaviour The behaviour of the actor in response to a message
 * @returns A reference to the spawned actor
 */
const spawn = (state, behaviour) => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        Function('init', 'spawn', 'spawnRemote', 'terminate', 'send', 'closeConnection', 'return ' + behaviour)(init, spawn, spawnRemote, terminate, send, closeConnection)
        : behaviour;

    //Generate unique name
    let name;
    do
        name = uuidv4();
    while (actors[name]);

    const actor = { name, node: yourNetworkNumber, state, behaviour: cleanedBehaviour, active: true };
    actors[name] = actor;

    return { name: actor.name, node: actor.node };
};

/**
 * Spawns an actor to a remote node
 * @param node The node referral number on the network
 * @param state The state to start the actor with
 * @param behaviour The behaviour of the actor when called
 * @param timeout How long to wait to receive an acknowledgement for the remotely spawned actor
 * @returns A promise which resolves into a reference to the remote actor
 */
const spawnRemote = (node, state, behaviour, timeout = 0x7fffffff) => {
    return new Promise((resolve, reject) => {
        const name = uuidv4();
        const payload = { header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state };
        forward(payload);
        on(name, () => {
            removeListener(name);
            if (remoteActors[name]) {
                resolve({ name: remoteActors[name], node });
            }
        });
        setTimeout(() => { reject(); }, timeout);
    });
};

/**
 * Sends a message object to a running actor.
 * @param actor The actor to send the message to
 * @param message The message object to send to an actor
 */
const send = (actor, message) => {
    if (actor.node === yourNetworkNumber) {
        const localActor = actors[actor.name];

        //Local send
        if (localActor) {
            Promise.resolve().then(() => {
                if (message !== undefined && localActor.active)
                    localActor.behaviour(localActor.state, message, { name: localActor.name, node: localActor.node });
            });
        }
    }
    else {
        //Create network payload
        const payload = { header: "MESSAGE", actor, to: actor.node, message };
        forward(payload);
    }
};

/**
 * Forwards the payload using the optimal transport mechanism
 * @param payload The payload to send
 */
const forward = (payload) => {
    const modifiedPayload = Object.assign({ from: yourNetworkNumber }, payload);
    if (workers[payload.to] || payload.to === primary)
        //If it is one of the neighbouring web workers, forward it to the relevant node
        if (!isWorker())
            workers[payload.to].postMessage(modifiedPayload);
        else
            postMessage(modifiedPayload);
    else
        //If recipient is not a neighbouring web worker, send over the network
        network.send(JSON.stringify(modifiedPayload));
};

/**
 * Terminates a local actor
 * @param actor The actor to terminate
 * @param force True to immediately stop the actor, false to let it process remaining messages and terminate safely
 */
const terminate = (actor, force = false) => {
    const localActor = actors[actor.name];
    if (localActor) {
        localActor.active = !force;
        delete actors[actor.name];
    }
};

export default { init, spawn, spawnRemote, terminate, send, closeConnection };