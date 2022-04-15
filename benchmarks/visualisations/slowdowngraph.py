import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem    
import re

#Scrape node results
data = {}
directory = '../node/micro/scaling-results'

#First populate names
for filename in os.listdir(directory):
    name = re.split(r"[\d]+", filename)[0]
    data[name] = {}

    
#Then populate multiplier information
for filename in os.listdir(directory):
    name = re.split(r"[\d]+", filename)[0]
    multiplier = int(filename.split(name)[1].split('x.txt')[0])
    data[name][multiplier] = []
    with open(f'{directory}/{filename}') as f:
        for line in f.readlines():
            data[name][multiplier].append(int(line.strip()))

    data[name][multiplier] = np.average(data[name][multiplier])
    
figure(figsize=(8, 6.5), dpi=80)
for name in data:
    ordered_data = []
    for multiplier in sorted(data[name]):
        ordered_data.append(data[name][multiplier])
        
    scaling_data = [ordered_data[n]/ordered_data[0] for n in np.arange(0, len(ordered_data))]
    plt.plot(sorted(data[name]), scaling_data, label=name, linewidth=2.5)
    
plt.legend(loc='upper left', shadow=True, fontsize='x-large')
plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Scaling Node Implementations')
plt.xlabel('Load multiplier')
plt.ylabel('Slowdown (over running 1x load)')
plt.xticks(np.arange(1,10), np.arange(1,10))
plt.grid()
plt.savefig('scaling.png')