#!/bin/bash

mkdir results
export NODE_OPTIONS=--max-old-space-size=4192;

run_benchmark(){
    node ../../../src/network.js $(($1+1)) 100 &
    sleep 1
    node mandelbrot_chunks.js $1 false >> results/$2.txt
    kill %%
}

run_benchmark 1 "mandelbrot_1worker"
run_benchmark 2 "mandelbrot_2worker"
run_benchmark 4 "mandelbrot_4worker"
run_benchmark 8 "mandelbrot_8worker"
run_benchmark 16 "mandelbrot_16worker"
run_benchmark 32 "mandelbrot_32worker"