import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem    

def compare(directory, title, output):
    #Scrape node results
    data = {}

    #First populate JS stats
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
            
        
    #Then get JVM ones
    for filename in os.listdir(directory):
        name = filename.split('.')[0].upper()
        if 'FYP' not in name:
            data[name] = []
            with open(f'{directory}/{filename}') as f:
                for line in f.readlines():
                    data[name].append(float(line.strip()))
                
    averages = [np.average(data[key]) for key in data.keys()]
    errors = [sem(data[key]) for key in data.keys()]
    figure(figsize=(8, 10.5), dpi=80)
    plt.bar(data.keys(), averages, yerr=errors, label='JVM')
    colour = [averages[0],averages[1]]
    colour.extend(np.zeros(len(averages)-len(colour)))
    plt.bar(data.keys(), colour, color='green', label='JS FYP')
    if 'NACT' in data.keys():
        colour = [0,0,averages[2],0,0,0,0,0,0,0,0]
        plt.bar(data.keys(), colour, color='darkorange', label='JS Other')
    plt.xticks(np.arange(len(averages)), list(data.keys()), rotation=45)
    plt.title(title)
    plt.xlabel('Environment')
    plt.ylabel('Time to execute (ms)')
    plt.grid()
    plt.legend(shadow=True, fontsize='x-large')
    plt.savefig(output)
    
compare('../node/micro/fibonacci-comparision', 'Fibonacci Execution compared with Savina Benchmark Suite', 'fibonacci.png')
compare('../node/micro/pingpong-comparision', 'Ping Pong Execution compared with Savina Benchmark Suite', 'pingpong.png')
compare('../node/micro/fjcreate-comparision', 'Fork Join Create Execution compared with Savina Benchmark Suite', 'forkjoin.png')