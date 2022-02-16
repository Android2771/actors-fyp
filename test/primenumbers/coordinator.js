const { spawn, remoteSpawn, terminate, send, getActor } = require('../../src/actors.js');
const WebSocket = require('ws');

const workers = ['1'];

coordinator = spawn({}, (state, message) => {
    console.log(message)
}, "coordinator");

workers.forEach(item => {
    const worker = new WebSocket('ws://localhost:808' + item);

    worker.on('open', () => {
        workerActor = remoteSpawn("worker", worker, {coordinator}, (state, message) => { 
            const {send} = require('../src/actors.js');

            primeNumbers = [];

            for(let i = message.primeFrom; i < message.primeTo; i++){
                if(i < 2)
                    continue;

                let isPrime = true;
                for (let j = 2; j < i; j++) {
                    if (i % j === 0) {
                        isPrime = false;
                        break;
                    }
                }
            
                if(isPrime)
                    primeNumbers.push(i);        
            }

            state.coordinator.ws = message.from;
            send(state.coordinator, {primeNumbers});
        });
    
        send(workerActor, {primeFrom: 1, primeTo: 100})
    });
    
    worker.on('message', message => {
        const messageJson = JSON.parse(message.toString())
        if("behaviour" in messageJson){
            spawn(messageJson.state, messageJson.behaviour, messageJson.name)
        }else{
            const referredActor = getActor(messageJson.name)
            send(referredActor, messageJson.message)
        }
    });
})