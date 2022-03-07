mkdir results
for f in *.js
do
	echo Started $f
	node $f $1 >> results/$f.txt
done
