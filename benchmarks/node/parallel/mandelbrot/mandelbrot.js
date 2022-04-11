import actors from '../../../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection } = actors
import fs from 'fs';

const constants = {
    width: 12000,
    height: 8000,
    realStart: -2,
    realEnd: 1,
    imaginaryStart: -1,
    imaginaryEnd: 1,
    iterations: 80
}

const K = parseInt(process.argv.slice(2)[0]);
const step = parseInt(process.argv.slice(2)[1]);
const rounds = parseInt(process.argv.slice(2)[2]);
const output = process.argv.slice(2)[3] === "true";

const rowRendererBehaviour = (state, message, self) => {
    const pixelRows = [];

    for(let y = message.start; y < message.end; y++){
        const row = [];
        for(let x = 0; x < state.width; x++){
            const cre = state.realStart + (x / state.width) * (state.realEnd - state.realStart);
            const cim = state.imaginaryStart + (y / state.height) * (state.imaginaryEnd - state.imaginaryStart);
            let zre = 0;
            let zim = 0;
            let n = 0;
            while(Math.sqrt(zre*zre+zim*zim) <= 2 && n < state.iterations){
                const zreOld = zre;
                zre = zre*zre - zim*zim;
                zim = zreOld*zim + zim*zreOld;
                zre = zre+cre;
                zim = zim+cim;
                n++;
            }
            const colour = 255 - parseInt(n * 255 / state.iterations);
            row.push(colour);
        }
        pixelRows.push(row);
    }

    send(message.sender, {header: "ROWS", pixelRows, start: message.start, from: self});
};

init('ws://localhost:8080', 0x7FFFFFF, K).then(ready => {    
    if(ready.yourNetworkNumber === 1){
        const imageRenderer = spawn({rounds, constants, rowRendererBehaviour, responses: {}, image: [], receivedRows: 0, nextRow: 0, actors: []}, (state, message, self) => {
            switch(message.header){
                case "START":
                    state.start = new Date();  
                    for(let i = 1; i <= K; i++){
                        spawnRemote(i+1, state.constants, state.rowRendererBehaviour).then(actor => {
                            state.actors.push(actor);
                            send(actor, {start: state.nextRow, end: state.nextRow+step, sender: self});  
                            state.nextRow += step                           
                        });
                    }                
                break;
                case "ROWS":
                    state.responses[message.start] = message.pixelRows;
                    state.receivedRows += step;

                    if(state.receivedRows >= state.constants.height){
                        state.end = new Date();
                        const time = state.end.getTime() - state.start.getTime();
                        console.log(time);

                        for(let i in state.responses)
                            for(const row of state.responses[i])
                                state.image.push(row);
                        
                        if(output)                            
                            fs.writeFile("mandelbrot.json", JSON.stringify(state.image), err => {closeConnection()});                        
                        else if(--state.rounds !== 0){
                            state.responses = {};
                            state.image = [];
                            state.receivedRows = 0;
                            state.nextRow = 0;
                            state.actors = [];
                            send(self, {header: "START"});
                        }
                        else{
                            closeConnection();
                        }
                    }else if(state.nextRow !== state.constants.height){           
                            const end = state.nextRow+step >= state.constants.height ? state.constants.height : state.nextRow+step  
                            send(message.from, {start: state.nextRow, end, sender: self});
                            state.nextRow = end;
                    }
                break;
            }
        });
        
        send(imageRenderer, {header: "START"})
    }
});

