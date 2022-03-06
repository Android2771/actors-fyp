import EventEmitter from 'events';
class MessageEmitter extends EventEmitter { }
const messageEmitter = new MessageEmitter();
const spawnEmitter = new MessageEmitter();
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cluster from 'cluster';
import process from 'process';

const actors: { [key: string]: Actor } = {};
let workers: { [key: number]: any } = {};
let primary = 0;
const remoteActors: { [key: string]: string } = {};

let network: any;

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
    (state: object, message: object): void
}

//Actor object interface
interface Actor {
    name: string,
    node: number,
    state: { [key: string]: any },
    mailbox: object[]
}

const messageHandler = (messageJson: any) => {
    switch (messageJson.header) {
        case "SPAWN":
            //The spawn message is received when a spawn request is sent
            const name = spawn(messageJson.state, messageJson.behaviour)
            const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: name, remoteActorId: messageJson.remoteActorId }
            network.send(JSON.stringify(payload))
            break;
        case "SPAWNED":
            //The spawned message is received as an acknowledgement by the remote node
            //The message includes the name of the remote node so that it can be uniquely identified
            remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
            spawnEmitter.emit(messageJson.remoteActorId)
            break;
        case "MESSAGE":
            //A message addressed to a node that needs to be locally forwarded
            send(messageJson.name, messageJson.message)
            break;            
    }
}

const init = (url: string, timeout: number, numWorkers: number = 0): Promise<object> => {
    network = new ws(url);

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
                                if(exchanged){
                                    //Check if recipient of message is primary, if so handle
                                    if(message.to === messageJson.yourSocketNumber)
                                        messageHandler(message)
                                    else{
                                        //Forward message to respective worker node
                                        actors[message.name] = {name: message.name, node: message.to, state: {}, mailbox: []}
                                        send(message.name, message.message)       
                                        delete actors[message.name]                             
                                    }
                                }
                                else{
                                    //Put worker object in array
                                    workers[message] = worker;
                                    if(Object.keys(workers).length === numWorkers){
                                        //When all workers are connected, send payload of neighbour cluster nodes
                                        const payload = {primary: messageJson.yourSocketNumber, workers}
                                        for(let id in workers)
                                            workers[id].send(payload)                                        

                                        exchanged = true;
                                    }
                                }
                            })
                        }
                    } else {
                        process.on('message', (message: any) => {
                            if(exchanged)
                                messageHandler(message)
                            else{
                                primary = message.primary;
                                workers = message.workers;
                                exchanged = true;
                            }
                        })
                    }
                    break;
                case "READY":
                    //The ready message is received by the network when all nodes connected
                    if (cluster.isWorker)
                        (<any>process).send(messageJson.yourSocketNumber)
                    resolve(messageJson);
                    break;
                default:
                    messageHandler(messageJson);
                    break;
            }
        });
    })
}

/**
 * Spawns an actor.
 * @param name The name of the actor
 * @param state The initial state of the actor
 * @param behaviour The behaviour of the actor in response to a message
 * @returns The spawned actor
 */
const spawn = (state: object, behaviour: ActorCallback | string | Function): string => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        behaviour = Function('return ' + behaviour)() : behaviour;

    //Populate the context with the new actor with an empty mailbox and return the actor
    //Generate unique name
    let name: string
    do
        name = uuidv4()
    while (actors[name])

    const actor: Actor = { name, node: 0, state, mailbox: [] };
    actor.state['self'] = actor;

    messageEmitter.on(name, () => {
        process.nextTick(() => {
            let message = actor.mailbox.shift();
            if (message !== undefined)
                cleanedBehaviour(actor.state, message, actor.name);
        })
    });

    actors[name] = actor;

    return name;
}

/**
 * Spawns an actor to a remote node
 * @param node The node referral number on the network
 * @param state The state to start the actor with
 * @param behaviour The behaviour of the actor when called
 * @param timeout How long to wait for the actor to spawn
 * @returns A promise with the resolved actor
 */
const spawnRemote = (node: number, state: object, behaviour: ActorCallback, timeout: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const name = uuidv4()
        const actor: Actor = { name, node, state, mailbox: [] }
        const payload = JSON.stringify({ header: "SPAWN", to: node, remoteActorId: name, behaviour: behaviour.toString().trim().replace(/\n/g, ''), state })
        network.send(payload);
        spawnEmitter.once(name, () => {
            if (remoteActors[name]) {
                actor.name = remoteActors[name];
                actors[actor.name] = actor
                delete remoteActors[name]
                resolve(actor.name)
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
const send = (name: string, message: object): void => {
    const actor = actors[name];
    if (actor) {
        if (actor.node === 0) {
            //Local send
            actor.mailbox.push(message);
            messageEmitter.emit(actor.name);
        } else {
            //Create network payload
            const payload = { header: "MESSAGE", name: actor.name, to: actor.node, message }

            if(workers[actor.node] || primary != 0)
                //If it is one of the neighbouring cluster nodes, forward it to the relevant node
                if(primary === 0)
                    workers[actor.node].send(payload)
                else
                    (<any>process).send(payload)
            else
                //If recipient is not part of the cluster, send over the network
                network.send(JSON.stringify(payload))
        }
    }
}

/**
 * Terminates an actor. Removes the actor from the context, delete the actor object from memory
 * @param actor The actor to terminate
 * @param force True to immediately stop the actor, false to let it process remaining messages and terminate safely
 */
const terminate = (name: string, force: boolean = false) => {
    const actor = actors[name];
    if (actor) {
        messageEmitter.removeAllListeners(actor.name);
        if (force)
            actor.mailbox = []
        delete actors[actor.name]
    }
}

export default { init, spawn, spawnRemote, terminate, send }