import actors from '../../actors.js';
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

const K = 4;
const rounds = 100;

const rowRendererBehaviour = (state, message, self) => {
    const add = (x, y) => ({re: x.re + y.re, im: x.im + y.im});   
    const mul = (x, y) => ({re: x.re*y.re - x.im*y.im, im: x.re*y.im + x.im*y.re}); 
    const abs = z => Math.sqrt(z.re*z.re+z.im*z.im); 

    const mandelbrot = c => {        
        let z = {re: 0, im: 0};
        let n = 0;
        while(abs(z) <= 2 && n < state.iterations){
            z = add(mul(z, z), c);
            n += 1;
        }
        return n;
    };

    const pixelRow = [];

    for(let x = 0; x < state.width; x++){
        const c = {re: state.realStart + (x / state.width) * (state.realEnd - state.realStart),
                   im: state.imaginaryStart + (message.y / state.height) * (state.imaginaryEnd - state.imaginaryStart)};
        const m = mandelbrot(c);
        const colour = 255 - parseInt(m * 255 / state.iterations);
        pixelRow.push(colour);
    }

    send(message.sender, {header: "ROW", pixelRow, y: message.y, from: self});
};

init('ws://localhost:8080', 0x7FFFFFF, K).then(ready => {    
    if(ready.yourNetworkNumber === 1){
        const imageRenderer = spawn({rounds, constants, rowRendererBehaviour, responses: {}, image: [], receivedRows: 0, nextRow: 0, actors: []}, (state, message, self) => {
            switch(message.header){
                case "START":
                    state.start = new Date();  
                    //Spawn actors and initial fan out of work
                    state.nextRow = K;
                    for(let i = 1; i <= K; i++){
                        spawnRemote(i+1, state.constants, state.rowRendererBehaviour).then(actor => {
                            state.actors.push(actor);
                            send(actor, {y: i, sender: self});  
                        });
                    }                
                break;
                case "ROW":
                    state.responses[message.y] = message.pixelRow;
                    if(++state.receivedRows > state.constants.height){
                        for(let i in Object.keys(state.responses))
                            if(i > 0)
                                state.image.push(state.responses[i]);
                        
                        state.end = new Date();
                        const time = state.end.getTime() - state.start.getTime();
                        console.log(time);
                        if(--state.rounds != 0){
                            state.responses = {};
                            state.image = [];
                            state.receivedRows = 0;
                            state.nextRow = 0;
                            state.actors = [];
                            send(self, {header: "START"});
                        }
                        else
                            closeConnection();
                    }else if(state.nextRow++ <= state.constants.height){                              
                        send(message.from, {y: state.nextRow, sender: self});
                    }
                break;
            }
        });
        
        send(imageRenderer, {header: "START"})
    }
});

