import pandas
import matplotlib.pyplot as plt
import numpy as np
import os
import re

def get_node_average(path):  
    data = []  
    with open(path) as f:
        for line in f.readlines():
            data.append(int(line.strip()))
    
    return np.average(data), np.std(data)/np.sqrt(np.size(data))

def get_browser_average(path):
    data = []
    with open(path) as f:
        for line in f.readlines():
            sanitized_line = line.strip()
            if '.js ' in sanitized_line:
                reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
                data.append(int(reading))
                
    return np.average(data), np.std(data)/np.sqrt(np.size(data))
    
keys = ['PINGPONG', 'FJCREATE']
data = []
errors = []
data2 = [0,1,2,3]

#Note, these ping pong models were run for 1000000 messages
data.append(get_node_average('./results/pingpongcluster.txt')[0])
data.append(get_node_average('./results/pingpongnodews.txt')[0])
data.append(get_browser_average('./results/pingpongwebworker.txt')[0])
data.append(get_browser_average('./results/pingpongbrowserws.txt')[0])

errors.append(get_node_average('./results/pingpongcluster.txt')[1])
errors.append(get_node_average('./results/pingpongnodews.txt')[1])
errors.append(get_browser_average('./results/pingpongwebworker.txt')[1])
errors.append(get_browser_average('./results/pingpongbrowserws.txt')[1])

#Note, these fjcreate models were run for 20000 spawns
data.append(get_node_average('./results/fjcreatecluster.txt')[0])
data.append(get_node_average('./results/fjcreatenodews.txt')[0])
data.append(get_browser_average('./results/fjcreatewebworker.txt')[0])
data.append(get_browser_average('./results/fjcreatebrowserws.txt')[0])

errors.append(get_node_average('./results/fjcreatecluster.txt')[1])
errors.append(get_node_average('./results/fjcreatenodews.txt')[1])
errors.append(get_browser_average('./results/fjcreatewebworker.txt')[1])
errors.append(get_browser_average('./results/fjcreatebrowserws.txt')[1])

Ygirls = [10,20]
Zboys = [20,30]
  
X_axis = np.arange(len(keys))
  
plt.bar(X_axis - 0.15, [data[0], data[4]], 0.1, label = 'Cluster')
plt.bar(X_axis - 0.05, [data[1], data[5]], 0.1, label = 'Node WebSocket')  
plt.bar(X_axis + 0.05, [data[2], data[6]], 0.1, label = 'Web Worker')
plt.bar(X_axis + 0.15, [data[3], data[7]], 0.1, label = 'Browser WebSocket')
  
plt.xticks(X_axis, keys)
plt.title('Comparision of Communication Links')
plt.xlabel('Benchmark')
plt.ylabel('Time to execute benchmark (ms)')

plt.savefig('link.png')