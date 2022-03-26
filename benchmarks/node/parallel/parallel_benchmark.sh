#!/bin/bash

mkdir results

run_benchmark(){
    node ../../src/network.js $(($1+1)) &
    node piprecision.js $1 $2 >> results/$3.txt
    kill %%
}

run_benchmark 1 100 "pipresicion_1worker"
run_benchmark 2 100 "pipresicion_2worker"
run_benchmark 4 100 "pipresicion_4worker"
run_benchmark 8 100 "pipresicion_8worker"
run_benchmark 16 100 "pipresicion_16worker"
run_benchmark 32 100 "pipresicion_32worker"