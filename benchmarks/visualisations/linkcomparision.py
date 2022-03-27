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

keys.reverse()
data.reverse()

#Plot graph and make it look nice
df = pandas.DataFrame(dict(graph=keys,
                        m=[data[0], data[4]], n=[data[1], data[5]], o=[data[2], data[6]], p=[data[3], data[7]])) 

ind = np.arange(len(df))
width = 0.2

fig, ax = plt.subplots()
fig.set_size_inches(9, 5, forward=True)
ax.barh(ind, df.m, width, color='green', label='Browser WebSocket', xerr=[errors[0], errors[4]])
ax.barh(ind+width, df.n, width, color='blue', label='Browser WebWorker', xerr=[errors[1], errors[5]])
ax.barh(ind+2*width, df.o, width, color='red', label='Node WebSocket', xerr=[errors[2], errors[6]])
ax.barh(ind+3*width, df.p, width, color='orange', label='Node Cluster', xerr=[errors[3], errors[7]])

ax.set(yticks=ind + width, yticklabels=df.graph, ylim=[2*width - 1, len(df)])
ax.legend()

plt.title('Comparision of Communication Heavy Implementations using different links')
plt.ylabel('Benchmark')
plt.xlabel('Time to execute (ms)')
plt.savefig('link.png')