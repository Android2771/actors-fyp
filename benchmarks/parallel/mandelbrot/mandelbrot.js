import actors from '../../../src/actors.js';
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
const output = process.argv.slice(2)[1] === "true"

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

    for(let y = 0; y < state.height; y++){
        const c = {re: state.realStart + (message.x / state.width) * (state.realEnd - state.realStart),
                   im: state.imaginaryStart + (y / state.height) * (state.imaginaryEnd - state.imaginaryStart)};
        const m = mandelbrot(c);
        const colour = 255 - parseInt(m * 255 / state.iterations);
        pixelRow.push(colour);
    }

    send(message.sender, {header: "ROW", pixelRow, x: message.x, from: self});
};

init('ws://localhost:8080', 0x7FFFFFF, K).then(ready => {    
    if(ready.yourNetworkNumber === 1){
        const imageRenderer = spawn({constants, rowRendererBehaviour, responses: {}, image: [], receivedColumns: 0, nextColumn: 0, actors: []}, (state, message, self) => {
            switch(message.header){
                case "START":
                    state.start = new Date();  
                    //Spawn actors and initial fan out of work
                    state.nextColumn = K;
                    for(let i = 2; i <= K+1; i++){
                        spawnRemote(i, state.constants, state.rowRendererBehaviour).then(actor => {
                            state.actors.push(actor);
                            send(actor, {x: i-1, sender: self});  
                        });
                    }                
                break;
                case "ROW":
                    state.responses[message.x] = message.pixelRow;
                    if(++state.receivedColumns === state.constants.width){
                        for(let i in Object.keys(state.responses))
                            if(i > 0)
                                state.image.push(state.responses[i]);
                        
                        state.end = new Date();
                        const time = state.end.getTime() - state.start.getTime();
                        console.log(time);
                        if(output)                            
                            fs.writeFile("mandelbrot.json", JSON.stringify(state.image), err => {closeConnection()});                        
                        else
                            closeConnection();
                    }else{
                        if(++state.nextColumn <= state.constants.width){      
                            send(message.from, {x: state.nextColumn, sender: self});
                        }
                    }
                break;
            }
        });
        
        send(imageRenderer, {header: "START"})
    }
});

