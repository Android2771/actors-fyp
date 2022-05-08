import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem
import re

# Scrape node results
data = {}
keys = ['BIG', 'CHAMENEOS', 'COUNT', 'FJCREATE', 'FJTHRPUT', 'PINGPONG', 'THREADRING']
for key in keys:
    data[key] = {}

colours = ['steelblue', 'darkorange', 'green',
           'red', 'purple', 'brown', 'mediumorchid']
markers = ['-o', '-^', '-P', '-*', '-X', '-d', '-v']
index = 0
directory = './data/loadscaling'

# Then populate multiplier information
for filename in os.listdir(directory):
    if '.txt' in filename:
        name = re.split(r"[\d]+", filename)[0]
        multiplier = int(filename.split(name)[1].split('x.txt')[0])
        name = name.upper()
        data[name][multiplier] = []
        with open(f'{directory}/{filename}') as f:
            for line in f.readlines():
                data[name][multiplier].append(int(line.strip()))

figure(figsize=(8, 6.5), dpi=80)
for name in data:
    ordered_data = []
    for multiplier in sorted(data[name]):
        ordered_data.append(data[name][multiplier])

    scaling_data = [np.array(ordered_data[n])/np.array(ordered_data[0])
                    for n in np.arange(0, len(ordered_data))]
    scaling_data_average = [np.average(el) for el in scaling_data]
    scaling_data_err = [sem(el) for el in scaling_data]
    plt.plot(sorted(data[name]), scaling_data_average, markers[index],
             label=name, linewidth=2.5, color=colours[index],
             markersize=10,
             markerfacecolor=colours[index],
             markeredgecolor=colours[index],
             markeredgewidth=1)
    plt.fill_between(sorted(data[name]), np.array(scaling_data_average)-np.array(scaling_data_err),
                     np.array(scaling_data_average)+np.array(scaling_data_err), color=colours[index], alpha=0.2)
    index += 1

plt.legend(loc='upper left', shadow=True, fontsize='x-large')
plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Scaling Node Micro Benchmarks', fontsize=15)
plt.xlabel('Load multiplier', fontsize=15)
plt.ylabel('Slowdown (over running 1x load)', fontsize=15)
plt.yticks(fontsize=15)
plt.xticks(np.arange(1, 11), np.arange(1, 11), fontsize=15)
plt.grid()
plt.savefig('node_scaling.png')

for key in keys:
    data[key] = {}
index = 0
# Populate data
for filename in os.listdir(directory):
    if '.log' in filename:
        multiplier = int(filename.split('x.log')[0])

        for key in keys:
            data[key][multiplier] = []

        with open(f'{directory}/{filename}') as f:
            for line in f.readlines():
                sanitized_line = line.strip()
                sanitized_line = sanitized_line[sanitized_line.find('micro/'):]
                if '.js' in sanitized_line:
                    name = sanitized_line.split(
                        'micro/')[1].split('.js')[0].upper()
                    reading = int(
                        line[line.find('"')+1:line.find('"', line.find('"')+1)])
                    data[name][multiplier].append(reading)

figure(figsize=(8, 6.5), dpi=80)
for name in data:
    ordered_data = []
    for multiplier in sorted(data[name]):
        ordered_data.append(data[name][multiplier])

    scaling_data = [np.array(ordered_data[n])/np.array(ordered_data[0])
                    for n in np.arange(0, len(ordered_data))]
    scaling_data_average = [np.average(el) for el in scaling_data]
    scaling_data_err = [sem(el) for el in scaling_data]
    plt.plot(sorted(data[name]), scaling_data_average, markers[index],
             label=name, linewidth=2.5, color=colours[index],
             markersize=10,
             markerfacecolor=colours[index],
             markeredgecolor=colours[index],
             markeredgewidth=1)
    plt.fill_between(sorted(data[name]), np.array(scaling_data_average)-np.array(scaling_data_err),
                     np.array(scaling_data_average)+np.array(scaling_data_err), color=colours[index], alpha=0.2)
    index += 1

plt.legend(loc='upper left', shadow=True, fontsize='x-large')
plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Scaling Browser Micro Benchmarks', fontsize=15)
plt.xlabel('Load multiplier', fontsize=15)
plt.ylabel('Slowdown (over running 1x load)', fontsize=15)
plt.yticks(fontsize=15)
plt.xticks(np.arange(1, 11), np.arange(1, 11), fontsize=15)
plt.grid()
plt.savefig('browser_scaling.png')
