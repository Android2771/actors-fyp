import pandas
import matplotlib.pyplot as plt
import numpy as np
import os
import re

def make_graph(node_results_folder, browser_results_folder, title, output_name):
    keys = [1,2,3,4,8]
    node_data = {}
    browser_data = {}
    for processes in keys:
        node_data[processes] = []
        browser_data[processes] = []
        
        #Scrape node data
        with open(f'{node_results_folder}{processes}worker.txt') as f:
            for line in f.readlines():
                node_data[processes].append(int(line.strip()))
        
        #Scrape browser data      
        with open(f'{browser_results_folder}/{processes}worker.log') as f:
            for line in f.readlines():
                sanitized_line = line.strip()
                if '.js ' in sanitized_line:
                    reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
                    browser_data[processes].append(int(reading))

    keys = keys[:len(keys)-1]
    node_speedup = [np.average(node_data[1])/np.average(node_data[key]) for key in keys]
    browser_speedup = [np.average(browser_data[1])/np.average(browser_data[key]) for key in keys]
    
    fig, ax = plt.subplots()
    
    ax.plot(node_speedup, keys, '-o', color='blue',
         markersize=15, linewidth=4,
         markerfacecolor='white',
         markeredgecolor='black',
         markeredgewidth=1, label='Node');
    
    ax.plot(browser_speedup, keys, '-p', color='red',
        markersize=15, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Browser');
    
    legend = ax.legend(loc='upper left', shadow=True, fontsize='x-large')
    
    plt.title(title)
    plt.xlabel('Number of cores')
    plt.ylabel('Speedup (over running on one core)')
    plt.savefig(output_name)
    
make_graph('../node/parallel/mandelbrot/results/mandelbrot_', '../browser/parallel/mandelbrot/results', 'Parallel Speedup for Mandelbrot Implementation', 'mandelbrot.png')
make_graph('../node/parallel/results/piprecision_', '../browser/parallel/results', 'Parallel Speedup for Pi Precision Implementation', 'piprecision.png')