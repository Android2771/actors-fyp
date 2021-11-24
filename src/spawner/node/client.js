const WebSocket = require('ws');
const WebSocketServer = require('ws');
const {spawn, terminate, send} = require('../../actors.js');
const node = require('./node.json');
const spawnable = require('./spawnable.js')

let peerSocks = {};

//Init connection actor
let init = spawn({}, (state, message) => {
    //Open up connection with spawner for output
    const spawnerSock = new WebSocket(`ws://localhost:8080/?id=${node.name}`);
    spawnerSock.on('open', () => {
        try{
            //Wait for acknowledgement from server
            spawnerSock.on('message', message => {
                if(message.toString() === 'connect'){
                    //Connect to peers
                    for(const i in node.peers){
                        if(i != node.name){
                            peerSocks[i] = new WebSocket(`ws://localhost:${node.peers[i]}/?id=${node.name}`);
                        }
                    }

                    //Send acknowledgement to server that peers have been connected with
                    spawnerSock.send('connected with peers')
                    send(main, {spawnerSock});
                }
            })

            //Start server for peers
            const wss = new WebSocketServer.Server({ port: node.peers[node.name] });
            wss.on('connection', (ws, req) => {
                const nodeName = req.url.split('id=')[1]
                ws.on('message', message => {
                  console.log(`Node ${nodeName}: ${message}`);
                });
            }); 

            //Send acknowledgement to spawer
            spawnerSock.send('initialized')

        }catch(err){
            spawnerSock.send(err.toString())
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

    //Execute master code
})

//Start process
send(init, {})