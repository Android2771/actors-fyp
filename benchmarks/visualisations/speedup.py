import pandas
import matplotlib.pyplot as plt
import numpy as np
import os
import re

def make_graph(node_results_folder, browser_results_folder, title, output_name):
    keys = [32,16,8,4,2,1]
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

    #Plot graph and make it look nice
    df = pandas.DataFrame(dict(graph=keys,
                            n=node_speedup, m=browser_speedup)) 

    ind = np.arange(len(df))
    width = 0.4

    fig, ax = plt.subplots()
    fig.set_size_inches(10, 5, forward=True)
    ax.barh(ind, df.n, width, color='green', label='Node')
    ax.barh(ind + width, df.m, width, color='blue', label='Browser')

    ax.set(yticks=ind + width, yticklabels=df.graph, ylim=[2*width - 1, len(df)])
    ax.legend()

    plt.title(title)
    plt.ylabel('Number of cores')
    plt.xlabel('Speedup (over running on one core)')
    plt.savefig(output_name)
    
make_graph('../node/parallel/mandelbrot/results/mandelbrot_', '../browser/parallel/mandelbrot/results', 'Parallel Speedup for Mandelbrot Implementation', 'mandelbrot.png')
make_graph('../node/parallel/results/piprecision_', '../browser/parallel/results', 'Parallel Speedup for Pi Precision Implementation', 'piprecision.png')