#!/bin/bash

mkdir results
export NODE_OPTIONS=--max-old-space-size=4192;

run_benchmark(){
    node ../../../../src/network.js $(($1+1)) 100 &
    sleep 1
    node mandelbrot.js $1 $2 $3 false #> results/mandelbrot_$1worker.txt
    kill %%
}

run_batch(){
    run_benchmark 1 $1 $2
    run_benchmark 2 $1 $2
    run_benchmark 3 $1 $2 
    run_benchmark 4 $1 $2
}

run_batch $1 $2