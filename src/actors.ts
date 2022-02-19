const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();
const spawnEmitter = new MessageEmitter();
const ActorWebSocket = require('ws')

//Set counter to uniquely name actors
let localActorId : number = 0
let remoteActorId : number = 0

const actors : {[key: string]: Actor} = {};
const remoteActors : {[key: string] : string} = {};

let network : any;

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
interface ActorCallback{
    (state: object, message: object) : void
}

//Actor object interface
interface Actor{
    name: string,
    node: number,
    state: object,
    mailbox: object[]
}

const init = (url :  string) : Promise<object> => {
    network = new ActorWebSocket(url);

    //Handle incoming messages
    return new Promise(resolve => {
        network.on('message', (message : Buffer) => {
            const messageJson = JSON.parse(message.toString())
            console.log(messageJson)
            if(messageJson.header === "READY"){
                resolve(messageJson);
            }else if (messageJson.header === "SPAWN") {
                spawn(messageJson.state, messageJson.behaviour)
                const payload = {header: "SPAWNED", to: messageJson.from, actualActorId: localActorId, remoteActorId: messageJson.remoteActorId}
                network.send(JSON.stringify(payload))
            }else if (messageJson.header === "SPAWNED"){
                remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
                spawnEmitter.emit(messageJson.remoteActorId)
            }else if(messageJson.header === "MESSAGE"){
                const referredActor = getActor(messageJson.name)
                send(referredActor, messageJson.message)
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
const spawn = (state: object, behaviour: any) : Actor => {        
    const cleanedBehaviour = (typeof behaviour === "string") ?
        behaviour = Function(
            'exports',
            'require',
            'module',
            '__filename',
            '__dirname',
            'return ' + behaviour)
            (exports,require,module,__filename,__dirname) : behaviour;
    
    //Populate the context with the new actor with an empty mailbox and return the actor
    const name : string = (++localActorId).toString();
    const actor : Actor = {name, node: 0, state, mailbox: []};

    messageEmitter.on(name, () => {
        let message = actor.mailbox.shift();
        if(message !== undefined){
            cleanedBehaviour(actor.state, message);
        }
    });

    actors[name] = actor;

    return actor;
}

const spawnRemote = (node: number, state: object, behaviour: ActorCallback, timeout: number) : Promise<Actor> => {
    return new Promise((resolve, reject) => {
        const actor : Actor = {name: (++remoteActorId).toString(), node, state, mailbox: []}
        const payload = JSON.stringify({header: "SPAWN", to: node, remoteActorId, behaviour: behaviour.toString().trim().replace(/\n/g,''), state})
        network.send(payload);
        spawnEmitter.on(remoteActorId, () => {
            if(remoteActors[remoteActorId]){
                actor.name = remoteActors[remoteActorId];
                delete remoteActors[remoteActorId]
                resolve(actor)
            }
        });

        setTimeout(() => reject(actor), timeout);
    })
}

/**
 * Sends a message object to a running actor.
 * @param actor The actor to send the message to
 * @param message The message object to send to an actor
 */
const send = (actor: Actor, message: object) : void => {
    if(actor.node === 0){
        actor.mailbox.push(message);
        messageEmitter.emit(actor.name);  
    }else{      
        const payload = JSON.stringify({header: "MESSAGE", name: actor.name, to: actor.node, message})
        network.send(payload)
    }
}

/**
 * Terminates an actor. Removes the actor from the context, delete the actor object from memory
 * @param actor The actor to terminate
 */
const terminate = (actor: Actor) => {
    messageEmitter.removeAllListeners(actor.name);
}

/**
 * 
 * @param name Actor name
 * @returns Actor by that name
 */
const getActor = (name: string) : Actor => {
    return actors[name];
}

module.exports = {init, spawn, spawnRemote, terminate, send, getActor}