#!/bin/bash

export NODE_OPTIONS=--max-old-space-size=8192

node queuepromises.js 1000000 >> results/queuepromises.txt
node queuepromises.js 2000000 >> results/queuepromises.txt
node queuepromises.js 3000000 >> results/queuepromises.txt
node queuepromises.js 4000000 >> results/queuepromises.txt
node queuepromises.js 5000000 >> results/queuepromises.txt
node queuepromises.js 6000000 >> results/queuepromises.txt
node queuepromises.js 7000000 >> results/queuepromises.txt
node queuepromises.js 8000000 >> results/queuepromises.txt
node queuepromises.js 9000000 >> results/queuepromises.txt
node queuepromises.js 10000000 >> results/queuepromises.txt