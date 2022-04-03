#!/bin/bash

mkdir results
export NODE_OPTIONS=--max-old-space-size=4192;

run_benchmark(){
    node ../../../../src/network.js $(($1+1)) 100 &
    sleep 1
    node mandelbrot_rows.js $1 5 false > results/$2.txt
    kill %%
}

run_benchmark 1 "mandelbrot_1worker"
run_benchmark 2 "mandelbrot_2worker"
run_benchmark 3 "mandelbrot_3worker"
run_benchmark 4 "mandelbrot_4worker"