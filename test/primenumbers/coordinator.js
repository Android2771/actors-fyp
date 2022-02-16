const { spawn, remoteSpawn, terminate, send, getActor } = require('../../src/actors.js');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

coordinator = spawn({ready: 0, primeNumbers: 0, workers: [0,1], primeNumbersToCompute: 100000, times: [], maxLoops: 10}, (state, message) => {
    if(message.start){
        state.startTime = performance.now();  
        state.workers.forEach(item => {
            const worker = new WebSocket('ws://localhost:808' + (item+1).toString());
        
            worker.on('open', () => {
                workerActor = remoteSpawn("worker", worker, {coordinator, item}, (state, message) => {
                    console.log(`Processing ${message.primeFrom} to ${message.primeTo}`);
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
                    send(state.coordinator, {worker: state.item, primeNumbers});
                });
            
                send(workerActor, {primeFrom: parseInt((item/state.workers.length)*state.primeNumbersToCompute)+1, 
                    primeTo: parseInt(((item+1)/state.workers.length)*state.primeNumbersToCompute)})
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
        });  
    }else{
        state[message.worker] = message.primeNumbers
        state.ready++;
        state.primeNumbers += message.primeNumbers.length;
        if(state.ready === state.workers.length){
            const time = performance.now() - state.startTime
            console.log(`Retrieved ${state.primeNumbers} prime numbers in ${time}ms`)
            state.times.push(time)

            if(state.times.length < state.maxLoops){
                send(coordinator, {start: 1});
                state.ready = 0;
                state.primeNumbers = 0;
            }else{
                console.log(`Average time over ${state.maxLoops} executions is ${state.times.reduce((a, b) => (a+b)) / state.times.length}`);
            }
        }
    }
}, "coordinator");

send(coordinator, {start: 1});