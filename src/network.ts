const webSocket = require('ws');
const wss = new webSocket.Server({ port: 8080 });

const connections : WebSocket[] = [];
const connectionAddresses : {[address: string] : number[]} = {};
const expectedConnections : number = parseInt(process.argv.slice(2)[0]);

wss.on('connection', (ws : WebSocket, req: any) => {
    const address : string = req.socket.remoteAddress;
    const sockNo = connections.length;

    if(connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];

    connections.push(ws);

    if(connections.length === expectedConnections){
        connections.forEach(connection => {
            connection.send(JSON.stringify(connectionAddresses));
        });
    }
});