const { spawn, remoteSpawn, terminate, send, getActor } = require('../../src/actors.js');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

coordinator = spawn({ready: 0, primeNumbers: 0, workers: [0,1,2,3,4,5,6], workSplit: [0, .35, .55, .7, .8, .9, .95, 1], primeNumbersToCompute: 1000000, times: [], maxLoops: 10}, (state, message) => {
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
                    console.log("Done!")
                });
            
                send(workerActor, {primeFrom: parseInt(state.workSplit[item]*state.primeNumbersToCompute)+1, 
                    primeTo: parseInt(state.workSplit[item+1]*state.primeNumbersToCompute)})
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
            const time = performance.now() - state.startTime;
            state.times.push(time)

            state.ready = 0;
            state.primeNumbers = 0;

            if(state.times.length < state.maxLoops){
                send(coordinator, {start: 1});
            }else{
                console.log(`Average time over ${state.maxLoops} executions with ${state.workers.length} workers is ${state.times.reduce((a, b) => (a+b)) / state.times.length}ms`);
                state.workers.pop()
                state.times = []
                if(state.workers.length > 0)
                    send(coordinator, {start: 1});
            }
        }
    }
}, "coordinator");

send(coordinator, {start: 1});