#!/bin/bash

mkdir scaling-results
export NODE_OPTIONS=--max-old-space-size=8192

node count.js 5 2000000 > scaling-results/count1x.txt
node count.js 5 4000000 > scaling-results/count2x.txt
node count.js 5 6000000 > scaling-results/count3x.txt
node count.js 5 8000000 > scaling-results/count4x.txt
node count.js 5 10000000 > scaling-results/count5x.txt
node count.js 5 12000000 > scaling-results/count6x.txt
node count.js 5 14000000 > scaling-results/count7x.txt
node count.js 5 16000000 > scaling-results/count8x.txt
node count.js 5 18000000 > scaling-results/count9x.txt
node count.js 5 20000000 > scaling-results/count10x.txt

node pingpong.js 5 10000000  > scaling-results/pingpong1x.txt
node pingpong.js 5 20000000  > scaling-results/pingpong2x.txt
node pingpong.js 5 30000000  > scaling-results/pingpong3x.txt
node pingpong.js 5 40000000  > scaling-results/pingpong4x.txt
node pingpong.js 5 50000000  > scaling-results/pingpong5x.txt
node pingpong.js 5 60000000  > scaling-results/pingpong6x.txt
node pingpong.js 5 70000000  > scaling-results/pingpong7x.txt
node pingpong.js 5 80000000  > scaling-results/pingpong8x.txt
node pingpong.js 5 90000000  > scaling-results/pingpong9x.txt
node pingpong.js 5 100000000 > scaling-results/pingpong10x.txt

node fjcreate.js 5 200000  > scaling-results/fjcreate1x.txt
node fjcreate.js 5 400000  > scaling-results/fjcreate2x.txt
node fjcreate.js 5 600000  > scaling-results/fjcreate3x.txt
node fjcreate.js 5 800000  > scaling-results/fjcreate4x.txt
node fjcreate.js 5 1000000 > scaling-results/fjcreate5x.txt
node fjcreate.js 5 1200000 > scaling-results/fjcreate6x.txt
node fjcreate.js 5 1400000 > scaling-results/fjcreate7x.txt
node fjcreate.js 5 1600000 > scaling-results/fjcreate8x.txt
node fjcreate.js 5 1800000 > scaling-results/fjcreate9x.txt
node fjcreate.js 5 2000000 > scaling-results/fjcreate10x.txt

node threadring.js 5 10000000  > scaling-results/threadring1x.txt
node threadring.js 5 20000000  > scaling-results/threadring2x.txt
node threadring.js 5 30000000  > scaling-results/threadring3x.txt
node threadring.js 5 40000000  > scaling-results/threadring4x.txt
node threadring.js 5 50000000  > scaling-results/threadring5x.txt
node threadring.js 5 60000000  > scaling-results/threadring6x.txt
node threadring.js 5 70000000  > scaling-results/threadring7x.txt
node threadring.js 5 80000000  > scaling-results/threadring8x.txt
node threadring.js 5 90000000  > scaling-results/threadring9x.txt
node threadring.js 5 100000000 > scaling-results/threadring10x.txt

node fjthrput.js 5 1  > scaling-results/fjthrput1x.txt
node fjthrput.js 5 2  > scaling-results/fjthrput2x.txt
node fjthrput.js 5 3  > scaling-results/fjthrput3x.txt
node fjthrput.js 5 4  > scaling-results/fjthrput4x.txt
node fjthrput.js 5 5  > scaling-results/fjthrput5x.txt
node fjthrput.js 5 6  > scaling-results/fjthrput6x.txt
node fjthrput.js 5 7  > scaling-results/fjthrput7x.txt
node fjthrput.js 5 8  > scaling-results/fjthrput8x.txt
node fjthrput.js 5 9  > scaling-results/fjthrput9x.txt
node fjthrput.js 5 10 > scaling-results/fjthrput10x.txt

node fib.js 5 24 > scaling-results/fib25.txt
node fib.js 5 25 > scaling-results/fib26.txt
node fib.js 5 26 > scaling-results/fib27.txt
node fib.js 5 27 > scaling-results/fib28.txt
node fib.js 5 28 > scaling-results/fib29.txt
node fib.js 5 29 > scaling-results/fib30.txt
node fib.js 5 30 > scaling-results/fib31.txt
node fib.js 5 31 > scaling-results/fib32.txt
node fib.js 5 32 > scaling-results/fib33.txt
node fib.js 5 33 > scaling-results/fib34.txt

node chameneos.js 5 200000  > scaling-results/chameneos1x.txt
node chameneos.js 5 400000  > scaling-results/chameneos2x.txt
node chameneos.js 5 600000  > scaling-results/chameneos3x.txt
node chameneos.js 5 800000  > scaling-results/chameneos4x.txt
node chameneos.js 5 1000000 > scaling-results/chameneos5x.txt
node chameneos.js 5 1200000 > scaling-results/chameneos6x.txt
node chameneos.js 5 1400000 > scaling-results/chameneos7x.txt
node chameneos.js 5 1600000 > scaling-results/chameneos8x.txt
node chameneos.js 5 1800000 > scaling-results/chameneos9x.txt
node chameneos.js 5 2000000 > scaling-results/chameneos10x.txt

node big.js 5 100000  > scaling-results/big1x.txt
node big.js 5 200000  > scaling-results/big2x.txt
node big.js 5 300000  > scaling-results/big3x.txt
node big.js 5 400000  > scaling-results/big4x.txt
node big.js 5 500000  > scaling-results/big5x.txt
node big.js 5 600000  > scaling-results/big6x.txt
node big.js 5 700000  > scaling-results/big7x.txt
node big.js 5 800000  > scaling-results/big8x.txt
node big.js 5 900000  > scaling-results/big9x.txt
node big.js 5 1000000 > scaling-results/big10x.txt