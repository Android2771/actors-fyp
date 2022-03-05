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

const messageHandler = (messageJson) => {
    switch (messageJson.header) {
        case "SPAWN":
            const name = spawn(messageJson.state, messageJson.behaviour);
            const payload = { header: "SPAWNED", to: messageJson.from, actualActorId: name, remoteActorId: messageJson.remoteActorId };
            network.send(JSON.stringify(payload));
            break;
        case "SPAWNED":
            remoteActors[messageJson.remoteActorId] = messageJson.actualActorId;
            document.dispatchEvent(new CustomEvent('spawn' + messageJson.remoteActorId, {}));
            break;
        case "MESSAGE":
            send(messageJson.name, messageJson.message);
            break;
    }
};

export const init = (url, timeout, numWorkers = 1) => {
    network = new WebSocket(url);
    return new Promise((resolve, reject) => {
        setTimeout(reject, timeout);
        network.onmessage = (event) => {
            const messageJson = JSON.parse(event.data.toString());
            switch (messageJson.header) {
                case "ACK":
                    let exchanged = false;
                    
                    break;
                case "READY":
                    
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
    document.addEventListener(name, () => {
        let message = actor.mailbox.shift();
        if (message !== undefined)
            cleanedBehaviour(actor.state, message, actor.name);
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
        document.addEventListener('spawn' + name, () => {
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
            document.dispatchEvent(new CustomEvent(actor.name, {}));
        }
        else {
            const payload = { header: "MESSAGE", name: actor.name, to: actor.node, message };
            if (workers[actor.node])
                workers[actor.node].send(payload);
            else
                network.send(JSON.stringify(payload));
        }
    }
};
export const terminate = (name, force = false) => {
    const actor = actors[name];
    if (actor) {
        document.removeEventListener(actor.name);
        if (force)
            actor.mailbox = [];
        delete actors[actor.name];
    }
};

init('ws://localhost:8080', 5000).then(async () => {
    const hi = await spawnRemote(2, {}, (state, message, self) => { console.log(message) }, 5000)
    send(hi, { "header": "hi" })
})

export default { init, spawn, spawnRemote, terminate, send };