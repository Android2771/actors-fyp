import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem


def compare(directory, title, output):
    # Scrape node results
    data = {}

    # First populate JS stats
    for filename in os.listdir(directory):
        name = filename.split('.')[0].upper()
        if 'FYP' in name:
            data[name] = []
            with open(f'{directory}/{filename}') as f:
                for line in f.readlines():
                    data[name].append(float(line.strip()))
        if 'NACT' in name:
            data[name] = []
            with open(f'{directory}/{filename}') as f:
                for line in f.readlines():
                    data[name].append(float(line.strip()))

    # Then get JVM ones
    for filename in os.listdir(directory):
        name = filename.split('.')[0].upper()
        if 'FYP' not in name:
            data[name] = []
            with open(f'{directory}/{filename}') as f:
                for line in f.readlines():
                    data[name].append(float(line.strip()))

    averages = [np.average(data[key]) for key in data.keys()]
    errors = [sem(data[key]) for key in data.keys()]
    figure(figsize=(10.2, 13.2), dpi=80)
    plt.bar(data.keys(), averages, yerr=errors,
            hatch='//', color='steelblue', label='JVM', capsize=4)
    colour = [averages[0], averages[1]]
    colour.extend(np.zeros(len(averages)-len(colour)))
    plt.bar(data.keys(), colour, hatch='\\\\', color='green', label='JS FYP', capsize=4)
    if 'NACT' in data.keys():
        colour = [0, 0, averages[2], 0, 0, 0, 0, 0, 0, 0, 0]
        plt.bar(data.keys(), colour, color='darkorange',
                hatch='xx', label='JS Other')
    plt.rcParams['hatch.linewidth'] = 0.5
    plt.xticks(np.arange(len(averages)), list(data.keys()), rotation=45, fontsize=18)
    plt.yticks(fontsize=19)
    plt.title(title, fontsize=17)
    plt.xlabel('Environment', fontsize=17)
    plt.ylabel('Time to execute (ms)', fontsize=19)
    plt.grid()
    plt.legend(shadow=True, prop={'size': 18})
    plt.savefig(output)


compare('./data/savina/pingpong-comparision',
        'Ping Pong Execution compared with Savina Benchmark Suite', 'pingpong.png')
compare('./data/savina/fjcreate-comparision',
        'Fork Join Create Execution compared with Savina Benchmark Suite', 'forkjoin.png')
