import EventEmitter from 'events';
class MessageEmitter extends EventEmitter { }
const messageEmitter = new MessageEmitter();
const spawnEmitter = new MessageEmitter();
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';

const actors: { [key: string]: Actor } = {};
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
    state: {[key: string]: any},
    mailbox: object[]
}

const init = (url: string): Promise<object> => {
    network = new ws(url);

    //Handle incoming messages
    return new Promise(resolve => {
        network.on('message', (message: Buffer) => {
            const messageJson = JSON.parse(message.toString())
            if (messageJson.header === "READY") {
                //The ready message is received by the network when all nodes connected
                resolve(messageJson);
            } else if (messageJson.header === "SPAWN") {
                //The spawn message is received when a spawn request is sent
                const name = spawn(messageJson.state, messageJson.behaviour)
                const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: name, remoteActorId: messageJson.remoteActorId }
                network.send(JSON.stringify(payload))
            } else if (messageJson.header === "SPAWNED") {
                //The spawned message is received as an acknowledgement by the remote node
                //The message includes the name of the remote node so that it can be uniquely identified
                remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
                spawnEmitter.emit(messageJson.remoteActorId)
            } else if (messageJson.header === "MESSAGE") {
                //A message addressed to a node that needs to be locally forwarded
                send(messageJson.name, messageJson.message)
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
const spawn = (state: object, behaviour: ActorCallback | string): string => {
    const cleanedBehaviour = (typeof behaviour === "string") ?
        behaviour = Function(
            'exports',
            'require',
            'module',
            '__filename',
            '__dirname',
            'return ' + behaviour)
            (exports, require, module, __filename, __dirname) : behaviour;

    //Populate the context with the new actor with an empty mailbox and return the actor
    //Generate unique name
    let name : string
    do
        name = uuidv4()
    while(actors[name])

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
            process.nextTick(() => {
                if (remoteActors[name]) {
                    actor.name = remoteActors[name];
                    delete remoteActors[name]
                    resolve(actor.name)
                }
            });
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
    if(actor){
        if (actor.node === 0) {
            actor.mailbox.push(message);
            messageEmitter.emit(actor.name);
        } else {
            const payload = JSON.stringify({ header: "MESSAGE", name: actor.name, to: actor.node, message })
            network.send(payload)
        }
    }
}

/**
 * Terminates an actor. Removes the actor from the context, delete the actor object from memory
 * @param actor The actor to terminate
 * @param force True to immediately stop the actor, false to let it process remaining messages and terminate safely
 */
const terminate = (name: string, force: boolean) => {
    const actor = actors[name];
    if(actor){
        messageEmitter.removeAllListeners(actor.name);
        if(force)
            actor.mailbox = []
        delete actors[actor.name]
    }
}

export default { init, spawn, spawnRemote, terminate, send }