import pandas
import matplotlib.pyplot as plt
import numpy as np
import os
import re

#Declare vars
node_data = {}
browser_data = {}
node_directory = '../node/singlethread/results'

#Scrape node results
for filename in os.listdir(node_directory):
    name = filename.split('.')[0].upper()
    node_data[name] = []
    browser_data[name] = []
    with open(f'{node_directory}/{filename}') as f:
        for line in f.readlines():
            node_data[name].append(int(line.strip()))

#Compute node results to put on graph
node_averages = [np.average(node_data[key]) for key in node_data.keys()]
node_errors = [np.std(node_data[key])/np.sqrt(np.size(node_data[key])) for key in node_data.keys()]

#Scrape browser results
with open('../browser/singlethread/chrome_debug.log') as f:
    for line in f.readlines():
        sanitized_line = line.strip()
        if '.js ' in sanitized_line:
            #Get benchmark name
            search = 'source: http://'
            benchmark = sanitized_line[sanitized_line.find(search)+len(search):]
            benchmark = benchmark[benchmark.find('/')+1:benchmark.find('.')].upper()
            
            reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
            browser_data[benchmark].append(int(reading))
            
#Compute browser results to put on graph
browser_averages = [np.average(browser_data[key]) for key in browser_data.keys()]
browser_errors = [np.std(browser_data[key])/np.sqrt(np.size(browser_data[key])) for key in browser_data.keys()]
   
#Plot graph and make it look nice
df = pandas.DataFrame(dict(graph=node_data.keys(),
                           n=node_averages, m=browser_averages)) 

ind = np.arange(len(df))
width = 0.4

fig, ax = plt.subplots()
fig.set_size_inches(10, 5, forward=True)
ax.barh(ind, df.n, width, color='green', label='Node', xerr=node_errors)
ax.barh(ind + width, df.m, width, color='blue', label='Browser', xerr=browser_errors)

ax.set(yticks=ind + width, yticklabels=df.graph, ylim=[2*width - 1, len(df)])
ax.legend()

plt.title('Single Threaded Benchmarks Node.js and Browser Comparision')
plt.ylabel('Benchmark')
plt.xlabel('Time to execute (ms)')
plt.savefig('singlethread.png')