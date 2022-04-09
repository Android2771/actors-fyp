import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

let requests = 1000000;
const start = new Date();
ws.on('open', function open() {
  for(let i = 0; i < requests; i++)
    ws.send('{}')
});

ws.on('message', function message(data) {
  if(--requests === 0){
      console.log(new Date() - start)
  }
});