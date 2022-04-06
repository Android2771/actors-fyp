import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cluster from 'cluster';
import process from 'process';

const actors: { [key: string]: Actor } = {};
let workers: { [key: number]: any } = {};
let primary = 0;
let yourNetworkNumber = 0;
const remoteActors: { [key: string]: string } = {};

let network: any;

const events: { [key: string]: any } = {};

const on = (name: string, listener: Function) => {
    events[name] = listener;
}

const removeListener = (name: string) => {
    delete events[name];
}

const emit = (name: string) => {
    if (events[name])
        events[name]();
}

/**
 * state: The current state of the actor
 * message: The message the actor will process
 * 
 * This function will be passed by the programmer when spawning a new actor.
 * When processing a message, the actors framework will internally pass the state
 * and next message to the function and it is executed accordingly. The function
 * code is not limited to any behaviour and is free to manipulate the state and
 * message object accordingly
 */
interface ActorCallback {
    (state: object, message: object, self: ActorFacade): void
}

//Actor object interface
interface Actor {
    name: string,
    state: { [key: string]: any },
    behaviour: ActorCallback,
    node: number,
    active: boolean
}

//Actor facade interface
interface ActorFacade {
    name: string,
    node: number
}

const messageHandler = (messageJson: any) => {
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
}

/**
 * Establishes the connection with a WebSocket server which links other nodes hosting actors with an optional number of spawned cluster nodes
 * @param url The url to the WebSocket server
 * @param timeout The amount of time to wait for the server to allow for communication with other nodes
 * @param numWorkers The number of cluster nodes to spawn each of which will establish a connection with the server
 * @returns 
 */
const init = (url: string, timeout: number = 0x7fffffff, numWorkers: number = 0): Promise<object> => {
    network = new ws(url);
    let readyMessage: any;

    //Handle incoming messages
    return new Promise((resolve, reject) => {
        setTimeout(reject, timeout);
        network.on('message', (message: Buffer) => {
            const messageJson = JSON.parse(message.toString())
            switch (messageJson.header) {
                case "ACK":
                    //The acknowledgement sent from the server when receiving a request
                    let exchanged = false;

                    //Primary node will fork workers
                    if (cluster.isPrimary) {
                        for (let i = 0; i < numWorkers; i++) {
                            const worker = cluster.fork()
                            worker.on('message', (message: any) => {
                                if (exchanged) {
                                    //Check if recipient of message is primary, if so handle
                                    if (message.to === messageJson.yourNetworkNumber)
                                        messageHandler(message)
                                    else {
                                        //Forward message to respective worker node
                                        forward(message)
                                    }
                                }
                                else {
                                    //Put worker object in array
                                    workers[message] = worker;
                                    if (Object.keys(workers).length === numWorkers) {
                                        //When all workers are connected, send payload of neighbour cluster nodes
                                        const payload = { primary: messageJson.yourNetworkNumber, workers }
                                        for (let id in workers)
                                            workers[id].send(payload)

                                        exchanged = true;
                                        resolve(readyMessage)
                                    }
                                }
                            })
                        }
                    } else {
                        process.on('message', (message: any) => {
                            if (exchanged)
                                messageHandler(message)
                            else {
                                primary = message.primary;
                                workers = message.workers;

                                exchanged = true;
                                resolve(readyMessage)
                            }
                        })
                    }
                    break;
                case "READY":
                    yourNetworkNumber = messageJson.yourNetworkNumber;
                    //The ready message is received by the network when all nodes connected
                    if (cluster.isWorker)
                        (<any>process).send(messageJson.yourNetworkNumber)

                    if (numWorkers === 0)
                        resolve(messageJson);
                    else
                        readyMessage = messageJson;
                    break;
                default:
                    messageHandler(messageJson);
                    break;
            }
        });
    })
}

/**
 * Closes the connection
 */
const closeConnection = () => {
    network.close();
    process.exit();
}

/**
 * Spawns a local actor
 * @param state The initial state of the actor
 * @param behaviour The behaviour of the actor in response to a message
 * @returns A reference to the spawned actor
 */
const spawn = (state: object, behaviour: ActorCallback | string | Function): ActorFacade => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        Function('init', 'spawn', 'spawnRemote', 'terminate', 'send', 'closeConnection', 'return ' + behaviour)(init, spawn, spawnRemote, terminate, send, closeConnection)
        : behaviour;

    //Populate the context with the new actor with an empty mailbox and return the actor
    //Generate unique name
    let name: string;
    do
        name = uuidv4();
    while (actors[name])

    const actor: Actor = { name, node: yourNetworkNumber, state, behaviour: cleanedBehaviour, active: true };

    actors[name] = actor;

    return { name: actor.name, node: actor.node };
}

/**
 * Spawns an actor to a remote node
 * @param node The node referral number on the network
 * @param state The state to start the actor with
 * @param behaviour The behaviour of the actor when called
 * @param timeout How long to wait to receive an acknowledgement for the remotely spawned actor
 * @returns A promise which resolves into a reference to the remote actor
 */
const spawnRemote = (node: number, state: object, behaviour: ActorCallback, timeout: number = 0x7fffffff): Promise<ActorFacade> => {
    return new Promise((resolve, reject) => {
        const name = uuidv4()
        const payload = { header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state }
        forward(payload);
        on(name, () => {
            if (remoteActors[name]) {
                resolve({ name: remoteActors[name], node })
            }
        });

        setTimeout(() => reject(), timeout);
    })
}

/**
 * Sends a message object to a running actor.
 * @param actor The actor to send the message to
 * @param message The message object to send to an actor
 */
const send = (actor: ActorFacade, message: object): void => {
    if (actor.node === yourNetworkNumber) {
        const localActor = actors[actor.name]
        //Local send
        if (localActor) {
            Promise.resolve().then(() => {
                if (message !== undefined && localActor.active)
                    localActor.behaviour(localActor.state, message, { name: localActor.name, node: localActor.node });
            })
        }
    } else {
        //Create network payload
        const payload = { header: "MESSAGE", actor, to: actor.node, message }
        forward(payload);
    }
}

/**
 * Forwards the payload using the optimal transport mechanism
 * @param payload The payload to send
 */
const forward = (payload: any): void => {
    const modifiedPayload = { from: yourNetworkNumber, ...payload }
    if (workers[payload.to] || payload.to === primary)
        //If it is one of the neighbouring cluster nodes, forward it to the relevant node
        if (cluster.isPrimary)
            workers[payload.to].send(modifiedPayload)
        else
            (<any>process).send(modifiedPayload)
    else
        //If recipient is not part of the cluster, send over the network
        network.send(JSON.stringify(modifiedPayload))
}

/**
 * Terminates a local actor
 * @param actor The actor to terminate
 * @param force True to immediately stop the actor, false to let it process remaining messages and terminate safely
 */
const terminate = (actor: ActorFacade, force: boolean = false) => {
    const localActor = actors[actor.name];
    if (localActor) {
        removeListener(localActor.name)
        localActor.active = !force;
        delete actors[actor.name]
    }
}

export default { init, spawn, spawnRemote, terminate, send, closeConnection }