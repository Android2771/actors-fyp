mkdir results
for f in *.js
do
	echo Started $f
	node $f >> results/$f.txt
done
