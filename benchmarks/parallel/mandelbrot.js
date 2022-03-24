import actors from '../../src/actors.js';
const { init, spawn, spawnRemote, terminate, send } = actors
import {complex, abs, add, multiply} from 'mathjs'

const MAX_ITER = 80

const mandelbrot = c => {
    let z = 0;
    let n = 0;
    while(abs(z) <= 2 && n < MAX_ITER){
        z = complex(add(multiply(z, z), c));
        n += 1;
    }
    return n;
}

//Image size (pixels)
const WIDTH = 600;
const HEIGHT = 400;

//Plot window
const RE_START = -2;
const RE_END = 1;
const IM_START = -1;
const IM_END = 1;

const image = []

for(let x = 0; x < WIDTH; x++){
    const pixelRow = []
    for(let y = 0; y < HEIGHT; y++){
        //Convert pixel coordinate to complex number
        const c = complex(RE_START + (x / WIDTH) * (RE_END - RE_START),
                    IM_START + (y / HEIGHT) * (IM_END - IM_START));
        //Compute the number of iterations
        const m = mandelbrot(c);
        //The color depends on the number of iterations
        const colour = 255 - parseInt(m * 255 / MAX_ITER);
        pixelRow.push(colour);
    }
    image.push(pixelRow)
}