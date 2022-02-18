const webSocket = require('ws');
const wss = new webSocket.Server({ port: 8080 });

const connections : WebSocket[] = [];
const connectionAddresses : {[address: string] : number[]} = {};
const expectedConnections : number = parseInt(process.argv.slice(2)[0]);

wss.on('connection', (ws : any, req: any) => {
    //Get address and assign socket number
    const address : string = req.socket.remoteAddress;
    const sockNo = connections.length;

    //Append connection number to addresses dictionary
    if(connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];

    connections.push(ws);

    //If all connections done, send ready header to release barrier
    if(connections.length === expectedConnections){
        connections.forEach(connection => {
            connection.send(JSON.stringify({"header": "READY", connectionAddresses}));
        });
    }

    //Forward message to respective connection
    ws.on('message', (message : Buffer) => {
        const messageJson = JSON.parse(message.toString());

        if(!("to" in messageJson && "message" in messageJson)){
            ws.send(JSON.stringify({"header": "ERROR", message: "Invalid message"}))
        }else{
            const toSend = messageJson.message;
            connections[messageJson.to].send(JSON.stringify({"header": "MESSAGE", message: toSend}));
        }
    });
});