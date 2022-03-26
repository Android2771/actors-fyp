import pandas
import matplotlib.pyplot as plt
import numpy as np

df = pandas.DataFrame(dict(graph=['BIG', 'CHAMENEOS', 'COUNT', 'FIB', 'FJCREATE', 'FJTHRPUT', 'PINPONG', 'THREADRING'],
                           n=[1,2,3,4,5,6,7,8], m=[8,7,6,5,4,3,2,1])) 

ind = np.arange(len(df))
width = 0.4

fig, ax = plt.subplots()
fig.set_size_inches(8.5, 5, forward=True)
ax.barh(ind, df.n, width, color='green', label='Node')
ax.barh(ind + width, df.m, width, color='blue', label='Browser')

ax.set(yticks=ind + width, yticklabels=df.graph, ylim=[2*width - 1, len(df)])
ax.legend()

plt.savefig('plot.png')