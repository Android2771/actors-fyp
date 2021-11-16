const WebSocket = require('ws');
const {spawn, terminate, send} = require('../../actors.js');
const node = require('./node.json');
const spawnable = require('./spawnable.js')

//Init connection actor
let init = spawn({}, (state, message) => {
    //Open up connection with spawner for output
    const spawnerSock = new WebSocket(`ws://localhost:8080/?id=${node.name}`);
    spawnerSock.on('open', () => {
        try{
            send(main, {spawnerSock});
        }catch(err){
            spawnerSock.send(err.toString())
        }finally{            
            terminate(init);
        }
    })
})

//Main function spawns 
let main = spawn({}, (state, message) => {
    //First spawn functions
    node.behaviour.spawn.forEach(actorDef => {
        eval(`spawn(${JSON.stringify(actorDef.state)}, spawnable.${actorDef.name})`)
        message.spawnerSock.send(`Spawned ${actorDef.name}`)
    })
})

//Start process
send(init, {})