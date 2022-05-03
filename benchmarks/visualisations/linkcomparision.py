import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import sem    

def get_node_average(path):  
    data = []  
    with open(path) as f:
        for line in f.readlines():
            data.append(int(line.strip()))
    
    return np.average(data), sem(data)

def get_browser_average(path):
    data = []
    with open(path) as f:
        for line in f.readlines():
            sanitized_line = line.strip()
            if '.js ' in sanitized_line:
                reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
                data.append(int(reading))
                
    return np.average(data), sem(data)
    
keys = ['PINGPONG', 'FJCREATE']
data = []
errors = []
data2 = [0,1,2,3]

#Note, these ping pong models were run for 1000000 messages
data.append(get_node_average('../node/parallel/results/pingpongnetcluster.txt')[0])
data.append(get_node_average('../node/parallel/results/pingpongnetws.txt')[0])
data.append(get_browser_average('../browser/parallel/results/pingpongnetwebworker.log')[0])
data.append(get_browser_average('../browser/parallel/results/pingpongnetws.log')[0])

errors.append(get_node_average('../node/parallel/results/pingpongnetcluster.txt')[1])
errors.append(get_node_average('../node/parallel/results/pingpongnetws.txt')[1])
errors.append(get_browser_average('../browser/parallel/results/pingpongnetwebworker.log')[1])
errors.append(get_browser_average('../browser/parallel/results/pingpongnetws.log')[1])

#Note, these fjcreate models were run for 20000 spawns
data.append(get_node_average('../node/parallel/results/fjcreatenetcluster.txt')[0])
data.append(get_node_average('../node/parallel/results/fjcreatenetws.txt')[0])
data.append(get_browser_average('../browser/parallel/results/fjcreatenetwebworker.log')[0])
data.append(get_browser_average('../browser/parallel/results/fjcreatenetws.log')[0])

errors.append(get_node_average('../node/parallel/results/fjcreatenetcluster.txt')[1])
errors.append(get_node_average('../node/parallel/results/fjcreatenetws.txt')[1])
errors.append(get_browser_average('../browser/parallel/results/fjcreatenetwebworker.log')[1])
errors.append(get_browser_average('../browser/parallel/results/fjcreatenetws.log')[1])

Ygirls = [10,20]
Zboys = [20,30]
  
X_axis = np.arange(len(keys))
  
plt.bar(X_axis - 0.15, [data[0], data[4]], 0.1, hatch='//', label = 'Cluster', yerr=[errors[0], errors[4]])
plt.bar(X_axis - 0.05, [data[1], data[5]], 0.1, hatch='\\\\', label = 'Node WebSocket', yerr=[errors[1], errors[5]])  
plt.bar(X_axis + 0.05, [data[2], data[6]], 0.1, hatch='xx', label = 'Web Worker', yerr=[errors[2], errors[6]])
plt.bar(X_axis + 0.15, [data[3], data[7]], 0.1, hatch='++', label = 'Browser WebSocket', yerr=[errors[3], errors[7]])
  
plt.rcParams['hatch.linewidth'] = 0.5
plt.xticks(X_axis, keys)
plt.title('Comparision of Communication Links')
plt.xlabel('Benchmark')
plt.ylabel('Time to execute benchmark (ms)')
plt.legend()
plt.grid()

plt.savefig('link.png')