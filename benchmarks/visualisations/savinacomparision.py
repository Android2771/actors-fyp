import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
from scipy.stats import sem    

def compare(directory, title, output):
    #Scrape node results
    data = {}

    #First populate fyp stats
    for filename in os.listdir(directory):
        name = filename.split('.')[0].upper()
        if 'FYP' in name:
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
    plt.bar(data.keys(), [averages[0],averages[1],0,0,0,0,0,0,0,0], color='green', label='JS FYP')
    plt.xticks(np.arange(len(averages)), list(data.keys()), rotation=45)
    plt.title(title)
    plt.xlabel('Environment')
    plt.ylabel('Time to execute (ms)')
    plt.grid()
    plt.legend(loc='upper right', shadow=True, fontsize='x-large')
    plt.savefig(output)
    
compare('../node/micro/fibonacci-comparision', 'Fibonacci Execution compared with Savina Benchmark Suite', 'fibonacci.png')
compare('../node/micro/pingpong-comparision', 'Ping Pong Execution compared with Savina Benchmark Suite', 'pingpong.png')
compare('../node/micro/fjcreate-comparision', 'Fork Join Create Execution compared with Savina Benchmark Suite', 'forkjoin.png')