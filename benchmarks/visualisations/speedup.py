import pandas
import matplotlib.pyplot as plt
import numpy as np
import os
import re

node_averages = []
browser_averages = [1,2,3,4,5]
keys = [32,16,8,4,2,1]
node_data = {}
browser_data = {}

#Node data
for processes in keys:
    node_data[processes] = []
    with open(f'../node/parallel/mandelbrot/results/mandelbrot_{processes}worker.txt') as f:
        for line in f.readlines():
            node_data[processes].append(int(line.strip()))

keys = keys[:len(keys)-1]
node_speedup = [np.average(node_data[1])/np.average(node_data[key]) for key in node_data.keys()]
print(node_speedup)
#Plot graph and make it look nice
df = pandas.DataFrame(dict(graph=keys,
                           n=node_speedup, m=browser_averages)) 

ind = np.arange(len(df))
width = 0.4

fig, ax = plt.subplots()
fig.set_size_inches(10, 5, forward=True)
ax.barh(ind, df.n, width, color='green', label='Node')
ax.barh(ind + width, df.m, width, color='blue', label='Browser')

ax.set(yticks=ind + width, yticklabels=df.graph, ylim=[2*width - 1, len(df)])
ax.legend()

plt.title('Parallel Speedup for Mandelbrot Implementation')
plt.ylabel('Number of cores')
plt.xlabel('Speedup (over running on one core)')
plt.savefig('speedup.png')