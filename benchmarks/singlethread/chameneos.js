// Tests contention on mailbox (many to one)
const { init, spawn, spawnRemote, terminate, send, getActor } = require('../../src/actors.js');

const N = 100000;  //Number of meetings
const C = 10;      //Number of chameneos
const chameneosList = []
const rounds = 10

const mall = spawn({chameneosRequest: undefined, matchesLeft: N}, (state, message, self) => {    
    if(message.benchmarker)
        state.benchmarker = message.benchmarker

    //If there is already a request, match the two
    else if(state.chameneosRequest){
        if(state.matchesLeft > 0){
            send(state.chameneosRequest, {header: "match", match: message.from});
            send(message.from, {header: "match", match: state.chameneosRequest});
            delete state.chameneosRequest;
            state.matchesLeft--;
        }else{
            chameneosList.forEach(item => {
                item.mailbox = []
            })
            self.mailbox = []
            send(state.benchmarker, {header: "end"})
            state.matchesLeft = N
        }
    }else{
        state.chameneosRequest = message.from;
    }    
});

for(let i = 0; i < C; i++){
    chameneosList.push(spawn({mall}, (state, message, self) => {
        switch(message.header){
            case "send":
                send(state.mall, {from: self});
                send(self, {header: "send"});
            break;
            case "match":
                send(message.match, {header: "exchange", from: self})
            break;
            case "exchange":
                send(self, {header: "send"});
            break;
        }
    }))
}

const benchmarker = spawn({rounds, times: [], mall, chameneosList}, (state, message, self) => {
    switch(message.header){
        case "start":   
            state.start = new Date();    
            send(state.mall, {benchmarker: self})   
            state.chameneosList.forEach(item => {
                send(item, {header: "send"})
            }) 
        break;
        case "end":
            state.end = new Date()
            const time = state.end.getTime() - state.start.getTime()
            console.log(`Finished in ${time}ms`);
            state.times.push(time)
            state.rounds--;
            if(state.rounds === 0){
                const avg = state.times.reduce((a,b) => (a+b)) / state.times.length;
                console.log(`Average time: ${avg}ms`);
            }else{
                send(self, {header: "start"});
            }
        break;
    }
});

send(benchmarker, {header: "start"})