export {}
import {WebSocketServer} from 'ws';
const wss = new WebSocketServer({ port: 8080 });

const connections: any[] = [];
const connectionAddresses: { [address: string]: number[] } = {};
const expectedConnections: number = parseInt(process.argv.slice(2)[0]);

wss.on('connection', (ws: any, req: any) => {
    connections.push(ws);
    console.log(`Accepted ${connections.length}`)

    //Get address and assign socket number
    const address: string = req.socket.remoteAddress;
    const sockNo = connections.length;
    ws.send(JSON.stringify({"header": "ACK", yourSocketNumber: sockNo}))

    //Append connection number to addresses dictionary
    if (connectionAddresses[address])
        connectionAddresses[address].push(sockNo);
    else
        connectionAddresses[address] = [sockNo];

    //If all connections done, send ready header to release barrier
    if (connections.length === expectedConnections) {
        for (let i = 0; i < connections.length; i++) {
            connections[i].send(JSON.stringify({ "header": "READY", connectionAddresses, yourSocketNumber: i + 1 }))

            //Forward message to respective connection
            connections[i].on('message', (message: Buffer) => {
                const messageJson = JSON.parse(message.toString());
                connections[messageJson.to - 1].send(JSON.stringify({ from: i + 1, ...messageJson }));
            });
        }
    }
});
