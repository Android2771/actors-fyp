// Tests contention on mailbox (many to one)
import actors from '../browseractors.js';
const { init, spawn, spawnRemote, terminate, send} = actors

const N = 1200000;  //Number of meetings
const C = 10;      //Number of chameneos
const rounds = 5;

const mallBehaviour = (state, message, self) => {    
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
            send(state.benchmarker, {header: "end"})
            terminate(self, true)
        }
    }else{
        state.chameneosRequest = message.from;
    }    
};

const chameneosBehaviour = (state, message, self) => {
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
};

const benchmarker = spawn({rounds, chameneosList: []}, (state, message, self) => {
    switch(message.header){
        case "start":   
            state.start = new Date();    
            state.mall = spawn({chameneosRequest: undefined, matchesLeft: N}, mallBehaviour);
            send(state.mall, {benchmarker: self})   

            for(let i = 0; i < C; i++){
                const chameneos = spawn({mall: state.mall}, chameneosBehaviour)
                state.chameneosList.push(chameneos);       
            }
            
            state.chameneosList.forEach(item => {                
                send(item, {header: "send"})     
            })
        break;
        case "end":
            for(let i = 0; i < C; i++)
                terminate(state.chameneosList.pop())

            state.end = new Date();
            const time = state.end.getTime() - state.start.getTime()
            console.log(time);
            
            state.rounds--;
            if(state.rounds != 0)
                send(self, {header: "start"})
        break;
    }
});

send(benchmarker, {header: "start"})