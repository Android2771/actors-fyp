const NetworkWebSocket = require('ws');
const wss = new NetworkWebSocket.Server({ port: 8080 });

const connections : WebSocket[] = [];
const connectionAddresses : {[address: string] : number[]} = {};
const expectedConnections : number = parseInt(process.argv.slice(2)[0]);

wss.on('connection', (ws : any, req: any) => {

    //Get address and assign socket number
    const address : string = req.socket.remoteAddress;
    const sockNo = connections.length;

    connections.push(ws);
    console.log(`Accepted ${connections.length}`)

    //Append connection number to addresses dictionary
    if(connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];

    //If all connections done, send ready header to release barrier
    if(connections.length === expectedConnections){
        for(let i = 0; i < connections.length; i++){
            connections[i].send(JSON.stringify({"header": "READY", connectionAddresses, yourSocketNumber: i+1}))
        }
    }

    //Forward message to respective connection
    ws.on('message', (message : Buffer) => {
        const messageJson = JSON.parse(message.toString());

        if(!("to" in messageJson && "message" in messageJson)){
            ws.send(JSON.stringify({"header": "ERROR", message: "Invalid message"}))
        }else{
            connections[messageJson.to - 1].send(JSON.stringify({"header": "MESSAGE", ...messageJson}));
        }
    });
});