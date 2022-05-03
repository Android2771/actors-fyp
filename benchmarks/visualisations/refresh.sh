#!/bin/bash
rm *.png

for f in *.py
do
    python3 $f
done