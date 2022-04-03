#!/bin/bash

mkdir results

run_piprecision_benchmark(){
    node ../../../src/network.js $(($1+1)) &
    node piprecision.js $1 $2 > results/$3.txt
    kill %%
}

run_trapezoid_benchmark(){
    node ../../../src/network.js $(($1+1)) &
    node trapezoid.js $1 $2 > results/$3.txt
    kill %%
}

run_piprecision_benchmark 1 5 "piprecision_1worker"
run_piprecision_benchmark 2 5 "piprecision_2worker"
run_piprecision_benchmark 3 5 "piprecision_3worker"
run_piprecision_benchmark 4 5 "piprecision_4worker"

run_trapezoid_benchmark 1 5 "trapezoid_1worker"
run_trapezoid_benchmark 2 5 "trapezoid_2worker"
run_trapezoid_benchmark 3 5 "trapezoid_3worker"
run_trapezoid_benchmark 4 5 "trapezoid_4worker"