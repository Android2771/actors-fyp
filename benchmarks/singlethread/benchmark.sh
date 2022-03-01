mkdir results
for f in *.js
do
	echo Started $f
	node $f $1 >> results/$f
	echo Finished $f
done
