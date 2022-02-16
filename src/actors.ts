const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();
//STORE CONTEXT LOCALLY
//Actor behaviour callback function interface

//Set counter to uniquely name actors
let i : number = 0

let actors : {[key: string]: Actor} = {};

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
    ws: any,
    state: object,
    mailbox: object[]
}

const getActor = (name: string) : Actor => {
    return actors.name;
}

module.exports = {
    /**
     * Spawns an actor.
     * @param name The name of the actor
     * @param state The initial state of the actor
     * @param behaviour The behaviour of the actor in response to a message
     * @returns The spawned actor
     */
    spawn : (state: object, behaviour: ActorCallback | string, actorName : string = "") : Actor => {
        //Populate the context with the new actor with an empty mailbox and return the actor
        const name : string = actorName ? actorName : (i++).toString();

        if(getActor(name))
            return {name: '', ws: null, state: {}, mailbox: []};

        const actor : Actor = {name, ws: null, state, mailbox: []};

        messageEmitter.on(name, () => {
            let message = actor.mailbox.shift();
            if(message !== undefined){
                if(typeof behaviour === "string"){
                    eval(`(${behaviour})(${JSON.stringify(actor.state)}, ${JSON.stringify(message)})`)
                }else{
                    behaviour(actor.state, message)
                }
            }
        });

        actors['name'] = actor;

        return actor;
    },

    remoteSpawn : (name: string, wsLink: any, state: object, behaviour: ActorCallback) : Actor => {
        const ws = new WebSocket(wsLink);
        const actor : Actor = {name, ws, state, mailbox: []}
        const payload = JSON.stringify({name, behaviour: behaviour.toString().trim().replace(/\n/g,''), state})
        ws.send(payload)
        return actor;
    },

    /**
     * Terminates an actor.
     * @param actor The actor to terminate
     */
    terminate : (actor: Actor) => {
        //Remove the actor from the context, delete the actor object from memory
        messageEmitter.removeAllListeners(actor.name);
    },

    /**
     * Sends a message object to a running actor.
     * @param actor The actor to send the message to
     * @param message The message object to send to an actor
     */
    send: (actor: Actor, message: object) : void => {
        /*Push the message object to the recipient actor's mailbox.
        * This function needs to be asynchronous. How do we make it that the recipient actor 
        * has its mailbox populated with a guarantee that it will eventually execute?
        */
        if(actor.ws !== null){
            actor.ws.send(JSON.stringify({name: actor.name, message}))    
        }else{
            actor.mailbox.push(message);
            messageEmitter.emit(actor.name);        
        }
    },
    getActor
}