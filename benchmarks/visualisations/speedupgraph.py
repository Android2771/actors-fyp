import matplotlib.pyplot as plt
from matplotlib.pyplot import figure
import numpy as np
from scipy.stats import sem    

######
#NODE
######
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
    
mandelbrot_noharvest_speedup_data = []
mandelbrot_withharvest_speedup_data = []
piprecision_speedup_data = []
trapezoid_speedup_data = []

#Calculate speedup by dividing each element of 1 with the corresponding n processes element
#This will make it possible to get approximate speedup with the standard error
for n in np.arange(1, len(mandelbrot_noharvest_data)+1):
    mandelbrot_noharvest_speedup_data.append(np.array(mandelbrot_noharvest_data[1])/np.array(mandelbrot_noharvest_data[n]))
    mandelbrot_withharvest_speedup_data.append(np.array(mandelbrot_withharvest_data[1])/np.array(mandelbrot_withharvest_data[n]))
    piprecision_speedup_data.append(np.array(piprecision_data[1])/np.array(piprecision_data[n]))
    trapezoid_speedup_data.append(np.array(trapezoid_data[1])/np.array(trapezoid_data[n]))
    
mandelbrot_noharvest_speedup = [np.average(el) for el in mandelbrot_noharvest_speedup_data]
mandelbrot_withharvest_speedup = [np.average(el) for el in mandelbrot_withharvest_speedup_data]
piprecision_speedup = [np.average(el) for el in piprecision_speedup_data]
trapezoid_speedup = [np.average(el) for el in trapezoid_speedup_data]

mandelbrot_noharvest_speedup_err = [sem(el) for el in mandelbrot_noharvest_speedup_data]
mandelbrot_withharvest_speedup_err = [sem(el) for el in mandelbrot_withharvest_speedup_data]
piprecision_speedup_err = [sem(el) for el in piprecision_speedup_data]
trapezoid_speedup_err = [sem(el) for el in trapezoid_speedup_data]

figure(figsize=(7.5, 6), dpi=80)
plt.plot(keys, mandelbrot_noharvest_speedup, '-s', color='blue',
        markersize=13, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot no harvest');

plt.errorbar(keys, mandelbrot_noharvest_speedup, yerr = mandelbrot_noharvest_speedup_err,fmt='none',ecolor ='blue',color='blue')

plt.plot(keys, mandelbrot_withharvest_speedup, '-*', color='purple',
        markersize=20, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot with harvest');

plt.errorbar(keys, mandelbrot_withharvest_speedup, yerr = mandelbrot_withharvest_speedup_err,fmt='none',ecolor ='purple',color='purple')

plt.plot(keys, piprecision_speedup, '-D', color='red',
    markersize=13, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Pi Precision');

plt.errorbar(keys, piprecision_speedup, yerr = piprecision_speedup_err,fmt='none',ecolor ='red',color='red')

plt.plot(keys, trapezoid_speedup, '-8', color='green',
    markersize=13, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Trapezoid');

plt.errorbar(keys, trapezoid_speedup, yerr = trapezoid_speedup_err, fmt='none',ecolor ='green',color='green')

legend = plt.legend(loc='upper left', shadow=True, fontsize='x-large')

plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Node Speedup for Parallel Benchmarks', fontsize=15)
plt.xlabel('Number of Child Processes', fontsize=15)
plt.ylabel('Speedup (over running on one child process)', fontsize=14)
ax = plt.gca()
ax.set_ylim([0.7, 4])
plt.grid()
plt.xticks(keys, keys)
plt.yticks(keys, keys)
plt.savefig('node_speedup.png')

def scrape_log_line(line, search):
    sanitized_line = line.strip()
    if '.js ' in sanitized_line:
        #Get benchmark name
        benchmark = sanitized_line[sanitized_line.find(search)+len(search):]
        benchmark = benchmark[benchmark.find('/')+1:benchmark.find('.')].upper()
        reading = sanitized_line[sanitized_line.find('"')+1:sanitized_line.find('"', sanitized_line.find('"')+1)]
        return int(reading)
            
#########
#BROWSER 
#########
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
            
mandelbrot_noharvest_speedup_data = []
mandelbrot_withharvest_speedup_data = []
piprecision_speedup_data = []
trapezoid_speedup_data = []

#Calculate speedup by dividing each element of 1 with the corresponding n processes element
#This will make it possible to get approximate speedup with the standard error
for n in np.arange(1, len(mandelbrot_noharvest_data)+1):
    mandelbrot_noharvest_speedup_data.append(np.array(mandelbrot_noharvest_data[1])/np.array(mandelbrot_noharvest_data[n]))
    mandelbrot_withharvest_speedup_data.append(np.array(mandelbrot_withharvest_data[1])/np.array(mandelbrot_withharvest_data[n]))
    piprecision_speedup_data.append(np.array(piprecision_data[1])/np.array(piprecision_data[n]))
    trapezoid_speedup_data.append(np.array(trapezoid_data[1])/np.array(trapezoid_data[n]))
    
mandelbrot_noharvest_speedup = [np.average(el) for el in mandelbrot_noharvest_speedup_data]
mandelbrot_withharvest_speedup = [np.average(el) for el in mandelbrot_withharvest_speedup_data]
piprecision_speedup = [np.average(el) for el in piprecision_speedup_data]
trapezoid_speedup = [np.average(el) for el in trapezoid_speedup_data]

mandelbrot_noharvest_speedup_err = [sem(el) for el in mandelbrot_noharvest_speedup_data]
mandelbrot_withharvest_speedup_err = [sem(el) for el in mandelbrot_withharvest_speedup_data]
piprecision_speedup_err = [sem(el) for el in piprecision_speedup_data]
trapezoid_speedup_err = [sem(el) for el in trapezoid_speedup_data]

figure(figsize=(7.5, 6), dpi=80)
plt.plot(keys, mandelbrot_noharvest_speedup, '-s', color='blue',
        markersize=13, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot no harvest');

plt.errorbar(keys, mandelbrot_noharvest_speedup, yerr = mandelbrot_noharvest_speedup_err,fmt='none',ecolor ='blue',color='blue')

plt.plot(keys, mandelbrot_withharvest_speedup, '-*', color='purple',
        markersize=20, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Mandelbrot with harvest');

plt.errorbar(keys, mandelbrot_withharvest_speedup, yerr = mandelbrot_withharvest_speedup_err,fmt='none',ecolor ='purple',color='purple')

plt.plot(keys, piprecision_speedup, '-D', color='red',
    markersize=13, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Pi Precision');

plt.errorbar(keys, piprecision_speedup, yerr = piprecision_speedup_err,fmt='none',ecolor ='red',color='red')

plt.plot(keys, trapezoid_speedup, '-8', color='green',
    markersize=13, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Trapezoid');

plt.errorbar(keys, trapezoid_speedup, yerr = trapezoid_speedup_err, fmt='none',ecolor ='green',color='green')

legend = plt.legend(loc='upper left', shadow=True, fontsize='x-large')

plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Browser Speedup for Parallel Benchmarks', fontsize=15)
plt.xlabel('Number of Web Workers', fontsize=15)
plt.ylabel('Speedup (over running on one web worker)', fontsize=14)
ax = plt.gca()
ax.set_ylim([0.7, 4])
plt.grid()
plt.xticks(keys, keys)
plt.yticks(keys, keys)
plt.savefig('browser_speedup.png')

#############
#DISTRIBUTED
#############
keys = [1,2,3,4,5,6,7,8,9,10]
mandelbrot_node_data = {}
mandelbrot_browser_data = {}

for processes in keys:
    mandelbrot_node_data[processes] = []
    mandelbrot_browser_data[processes] = []
    
    #Scrape node data
    with open(f'../node/parallel/mandelbrot/distributed-results/mandelbrotnoharvest_{processes}worker.txt') as f:
        for line in f.readlines():
            mandelbrot_node_data[processes].append(int(line.strip()))
            
    #Scrape browser data
    with open(f'../browser/parallel/mandelbrot/distributed-results/mandelbrotnoharvest_{processes}worker.log') as f:
        for line in f.readlines():
            reading = scrape_log_line(line, 'source: http://localhost:3000/parallel/mandelbrot/')
            if reading is not None:
                mandelbrot_browser_data[processes].append(reading)
            
            
mandelbrot_node_speedup_data = []
mandelbrot_browser_speedup_data = []

for n in np.arange(1, len(mandelbrot_node_data)+1):
    mandelbrot_node_speedup_data.append(np.array(mandelbrot_node_data[1])/np.array(mandelbrot_node_data[n]))
    mandelbrot_browser_speedup_data.append(np.array(mandelbrot_browser_data[1])/np.array(mandelbrot_browser_data[n]))
    
mandelbrot_node_speedup = [np.average(el) for el in mandelbrot_node_speedup_data]
mandelbrot_browser_speedup = [np.average(el) for el in mandelbrot_browser_speedup_data]

mandelbrot_node_speedup_err = [sem(el) for el in mandelbrot_node_speedup_data]
mandelbrot_browser_speedup_err = [sem(el) for el in mandelbrot_browser_speedup_data]

figure(figsize=(7.5, 6), dpi=80)
plt.axvline(x=4, ymin=0, ymax=10, color='black', label='Local up to here')

plt.plot(keys, mandelbrot_node_speedup, '-*', color='blue',
        markersize=21, linewidth=4,
        markerfacecolor='white',
        markeredgecolor='black',
        markeredgewidth=1, label='Node');

plt.errorbar(keys, mandelbrot_node_speedup, yerr = mandelbrot_node_speedup_err,fmt='none',ecolor ='blue',color='blue')

plt.plot(keys, mandelbrot_browser_speedup, '-D', color='red',
    markersize=13, linewidth=4,
    markerfacecolor='white',
    markeredgecolor='black',
    markeredgewidth=1, label='Browser');

plt.errorbar(keys, mandelbrot_browser_speedup, yerr = mandelbrot_browser_speedup_err,fmt='none',ecolor ='red',color='red')

plt.legend(loc='lower right', shadow=True, fontsize='x-large')
plt.locator_params(axis="x", integer=True, tight=True)
plt.title('Distributed Speedup for Mandelbrot Benchmark without Harvesting', fontsize=13)
plt.xlabel('Number of Workers', fontsize=14)
plt.ylabel('Speedup (over running on one worker)', fontsize=14)
plt.grid()
ax = plt.gca()
ax.set_ylim([0, 10])
plt.xticks(keys, keys)
plt.yticks(keys, keys)
plt.savefig('distributed_memory_speedup.png')