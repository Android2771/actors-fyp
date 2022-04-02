import pandas
import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
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

# #Scrape browser results
# with open('../browser/singlethread/chrome_debug.log') as f:
#     for line in f.readlines():
#         sanitized_line = line.strip()
#         if '.js ' in sanitized_line:
#             #Get benchmark name
#             search = 'source: http://'
#             benchmark = sanitized_line[sanitized_line.find(search)+len(search):]
#             benchmark = benchmark[benchmark.find('/')+1:benchmark.find('.')].upper()
            
#             reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
#             browser_data[benchmark].append(int(reading))
            
# #Compute browser results to put on graph
# browser_averages = [np.average(browser_data[key]) for key in browser_data.keys()]
# browser_errors = [np.std(browser_data[key])/np.sqrt(np.size(browser_data[key])) for key in browser_data.keys()] 

browser_averages = [1,2,3,4,5,6,7,8]
browser_errors = [1,2,3,4,5,6,7,8]

X_axis = np.arange(len(node_averages))
width=0.2
figure(figsize=(8, 7), dpi=80)
plt.bar(X_axis-0.1, node_averages, width, color='green', label='Node', yerr=node_errors)
plt.bar(X_axis+0.1, browser_averages, width, color='blue', label='Browser', yerr=browser_errors)

plt.xticks(X_axis, list(node_data.keys()), rotation=45)
plt.title('Single Threaded Benchmarks Node.js and Browser Comparision')
plt.xlabel('Benchmark')
plt.ylabel('Time to execute (ms)')
plt.legend()
plt.savefig('singlethread.png')