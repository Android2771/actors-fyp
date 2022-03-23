mkdir results
export NODE_OPTIONS=--max-old-space-size=8192
for f in *.js
do
	echo Started $f
	node $f $1 >> results/$f.txt
done
