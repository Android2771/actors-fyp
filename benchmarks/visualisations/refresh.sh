#!/bin/bash
rm *.png

python3 linkcomparision.py 
python3 micro.py 
python3 savinacomparision.py 
python3 slowdowngraph.py 
python3 speedupgraph.py 