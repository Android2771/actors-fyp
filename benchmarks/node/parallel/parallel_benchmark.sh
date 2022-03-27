#!/bin/bash

mkdir results

run_benchmark(){
    node ../../../src/network.js $(($1+1)) &
    node piprecision.js $1 $2 >> results/$3.txt
    kill %%
}

run_benchmark 1 100 "piprecision_1worker"
run_benchmark 2 100 "piprecision_2worker"
run_benchmark 4 100 "piprecision_4worker"
run_benchmark 8 100 "piprecision_8worker"
run_benchmark 16 100 "piprecision_16worker"
run_benchmark 32 100 "piprecision_32worker"