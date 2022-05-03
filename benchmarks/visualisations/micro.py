import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem    

#Declare vars
node_data = {}
browser_data = {}
node_directory = '../node/micro/results'
micro_benchmarks = ['pingpong', 'threadring', 'count', 'fjthrput', 'fjcreate', 'fib', 'chameneos', 'big']

#Scrape node results
for benchmark in micro_benchmarks:
    name = benchmark.upper()
    node_data[name] = []
    browser_data[name] = []
    with open(f'{node_directory}/{benchmark}.js.txt') as f:
        for line in f.readlines():
            node_data[name].append(int(line.strip()))

#Compute node results to put on graph
node_averages = [np.average(node_data[key]) for key in node_data.keys()]
node_errors = [sem(node_data[key]) for key in node_data.keys()]

#Scrape browser results
with open('../browser/micro/micro.log') as f:
    for line in f.readlines():
        sanitized_line = line.strip()
        if '.js ' in sanitized_line:
            #Get benchmark name
            search = 'source: http://localhost:3000/micro/'
            benchmark = sanitized_line[sanitized_line.find(search)+len(search):]
            benchmark = benchmark[benchmark.find('/')+1:benchmark.find('.')].upper()
            reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
            browser_data[benchmark].append(int(reading))
            
#Compute browser results to put on graph
browser_averages = [np.average(browser_data[key]) for key in browser_data.keys()]
browser_errors = [sem(browser_data[key]) for key in browser_data.keys()] 

X_axis = np.arange(len(node_averages))
width=0.2
figure(figsize=(8.5, 9.8), dpi=80)

plt.bar(X_axis-0.1, node_averages, width, color='green', hatch='//', label='Node', yerr=node_errors)
plt.bar(X_axis+0.1, browser_averages, width, color='steelblue', hatch='\\\\', label='Browser', yerr=browser_errors)

plt.rcParams['hatch.linewidth'] = 0.5
plt.xticks(X_axis, list(node_data.keys()), rotation=45)
plt.title('Micro-Benchmarks Node.js and Browser Comparision', fontsize=16)
plt.xlabel('Benchmark', fontsize=16)
plt.ylabel('Time to execute (ms)', fontsize=16)
plt.grid()
plt.legend(prop={'size': 16})
plt.savefig('micro.png')