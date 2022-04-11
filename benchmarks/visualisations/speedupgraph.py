import pandas
import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
import os
import re

keys = [1,2,3,4]
mandelbrot_noharvest_data = {}
mandelbrot_withharvest_data = {}
piprecision_data = {}
trapezoid_data = {}
for processes in keys:
    mandelbrot_noharvest_data[processes] = []
    mandelbrot_withharvest_data[processes] = []
    piprecision_data[processes] = []
    trapezoid_data[processes] = []
    
    #Scrape node data
    with open(f'../node/parallel/mandelbrot/results/mandelbrotnoharvest_{processes}worker.txt') as f:
        for line in f.readlines():
            mandelbrot_noharvest_data[processes].append(int(line.strip()))
    with open(f'../node/parallel/mandelbrot/results/mandelbrot_{processes}worker.txt') as f:
        for line in f.readlines():
            mandelbrot_withharvest_data[processes].append(int(line.strip()))
    with open(f'../node/parallel/results/piprecision_{processes}worker.txt') as f:
        for line in f.readlines():
            piprecision_data[processes].append(int(line.strip()))
    with open(f'../node/parallel/results/trapezoid_{processes}worker.txt') as f:
        for line in f.readlines():
            trapezoid_data[processes].append(int(line.strip()))
            
            
mandelbrot_noharvest_speedup = [np.average(mandelbrot_noharvest_data[1])/np.average(mandelbrot_noharvest_data[key]) for key in keys]
mandelbrot_withharvest_speedup = [np.average(mandelbrot_withharvest_data[1])/np.average(mandelbrot_withharvest_data[key]) for key in keys]
piprecision_speedup = [np.average(piprecision_data[1])/np.average(piprecision_data[key]) for key in keys]
trapezoid_speedup = [np.average(trapezoid_data[1])/np.average(trapezoid_data[key]) for key in keys]

figure(figsize=(7.5, 6), dpi=80)

plt.plot(keys, mandelbrot_noharvest_speedup, '-o', color='blue',
        markersize=15, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot no harvest');

plt.plot(keys, mandelbrot_withharvest_speedup, '-h', color='purple',
        markersize=15, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot with harvest');

plt.plot(keys, piprecision_speedup, '-p', color='red',
    markersize=15, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Pi Precision');

plt.plot(keys, trapezoid_speedup, '-8', color='green',
    markersize=15, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Trapezoid');

legend = plt.legend(loc='upper left', shadow=True, fontsize='x-large')

plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Node Speedup for Parallel Benchmarks')
plt.xlabel('Number of cores')
plt.ylabel('Speedup (over running on one core)')
plt.savefig('node_speedup.png')

def scrape_log_line(line, search):
    sanitized_line = line.strip()
    if '.js ' in sanitized_line:
        #Get benchmark name
        benchmark = sanitized_line[sanitized_line.find(search)+len(search):]
        benchmark = benchmark[benchmark.find('/')+1:benchmark.find('.')].upper()
        reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
        return int(reading)
            

mandelbrot_noharvest_data = {}
mandelbrot_withharvest_data = {}
piprecision_data = {}
trapezoid_data = {}

for processes in keys:
    mandelbrot_noharvest_data[processes] = []
    mandelbrot_withharvest_data[processes] = []
    piprecision_data[processes] = []
    trapezoid_data[processes] = []
    
    #Scrape browser data
    with open(f'../browser/parallel/mandelbrot/results/mandelbrot_{processes}worker.log') as f:
        for line in f.readlines():
            reading = scrape_log_line(line, 'source: http://localhost:3000/parallel/mandelbrot/')
            if reading is not None:
                mandelbrot_withharvest_data[processes].append(reading)
    with open(f'../browser/parallel/mandelbrot/results/mandelbrotnoharvest_{processes}worker.log') as f:
        for line in f.readlines():
            reading = scrape_log_line(line, 'source: http://localhost:3000/parallel/mandelbrot/')
            if reading is not None:
                mandelbrot_noharvest_data[processes].append(reading)
    with open(f'../browser/parallel/results/piprecision_{processes}worker.log') as f:
        for line in f.readlines():            
            reading = scrape_log_line(line, 'source: http://localhost:3000/parallel/')
            if reading is not None:
                piprecision_data[processes].append(reading)
    with open(f'../browser/parallel/results/trapezoid_{processes}worker.log') as f:
        for line in f.readlines():            
            reading = scrape_log_line(line, 'source: http://localhost:3000/parallel/')
            if reading is not None:
                trapezoid_data[processes].append(reading)
            
mandelbrot_noharvest_speedup = [np.average(mandelbrot_noharvest_data[1])/np.average(mandelbrot_noharvest_data[key]) for key in keys]
mandelbrot_withharvest_speedup = [np.average(mandelbrot_withharvest_data[1])/np.average(mandelbrot_withharvest_data[key]) for key in keys]
piprecision_speedup = [np.average(piprecision_data[1])/np.average(piprecision_data[key]) for key in keys]
trapezoid_speedup = [np.average(trapezoid_data[1])/np.average(trapezoid_data[key]) for key in keys]

figure(figsize=(7.5, 6), dpi=80)

print(mandelbrot_withharvest_data)
plt.plot(keys, mandelbrot_noharvest_speedup, '-o', color='blue',
        markersize=15, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot no harvest');

plt.plot(keys, mandelbrot_withharvest_speedup, '-h', color='purple',
        markersize=15, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot with harvest');

plt.plot(keys, piprecision_speedup, '-p', color='red',
    markersize=15, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Pi Precision');

plt.plot(keys, trapezoid_speedup, '-8', color='green',
    markersize=15, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Trapezoid');

legend = plt.legend(loc='upper left', shadow=True, fontsize='x-large')

plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Browser Speedup for Parallel Benchmarks')
plt.xlabel('Number of cores')
plt.ylabel('Speedup (over running on one core)')
plt.savefig('browser_speedup.png')