import actors from '../../actors.js';
const { init, spawn, spawnRemote, terminate, send, closeConnection } = actors

const constants = {
    width: 12000,
    height: 8000,
    realStart: -2,
    realEnd: 1,
    imaginaryStart: -1,
    imaginaryEnd: 1,
    iterations: 80
}

const K = 32;
const rounds = 5;

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

    const chunk = [];
    for(let y = message.start; y < message.end; y++){
        const column = [];
        for(let x = 0; x < state.width; x++){
            const c = {re: state.realStart + (x / state.width) * (state.realEnd - state.realStart),
                    im: state.imaginaryStart + (y / state.height) * (state.imaginaryEnd - state.imaginaryStart)};
            const m = mandelbrot(c);
            const colour = 255 - parseInt(m * 255 / state.iterations);
            column.push(colour);
        }
        chunk.push(column);
    }


    send(message.sender, {header: "CHUNK", chunk, start: message.start, end: message.end, from: self, i: message.i});
};

init('ws://localhost:8080', 0x7FFFFFF, K, './parallel/mandelbrot/mandelbrot_chunks.js').then(ready => {    
    if(ready.yourNetworkNumber === 1){
        const imageRenderer = spawn({rounds, constants, rowRendererBehaviour, responses: {}, image: [], receivedChunks: 0, actors: []}, (state, message, self) => {
            switch(message.header){
                case "START":
                    state.start = new Date();  
                    //Spawn actors and initial fan out of work
                    state.nextColumn = K;
                    for(let i = 1; i <= K; i++){
                        spawnRemote(i+1, state.constants, state.rowRendererBehaviour).then(actor => {
                            state.actors.push(actor);
                            const start = (i-1)*(state.constants.height/K);
                            const end = i*(state.constants.height/K);
                            send(actor, {start, end, sender: self, i: i-1});  
                        });
                    }                
                break;
                case "CHUNK":
                    state.responses[message.i] = message.chunk;
                    if(++state.receivedChunks === K){
                        state.end = new Date();
                        const time = state.end.getTime() - state.start.getTime();
                        console.log(time);

                        for(let i in Object.keys(state.responses))
                            for(const row of state.responses[i])
                                state.image.push(row);

                        if(--state.rounds != 0){
                                state.image = [];
                                state.responses = {};
                                state.receivedChunks = 0;
                                state.actors = [];
                                send(self, {header: "START"})
                            }
                            else
                                closeConnection();
                    }
                break;
            }
        });
        
        send(imageRenderer, {header: "START"})
    }
});

