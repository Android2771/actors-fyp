# import fileinput
import fileinput
import json
from PIL import Image, ImageDraw

  
for line in fileinput.input(files ='mandelbrot.json'):
    image = json.loads(line)
    width = len(image[0])
    height = len(image)
    im = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(im)

    for x in range(0, width):
        for y in range(0, height):
            colour = image[y][x]
            draw.point([x, y], (colour, colour, colour))
            
    im.save('output.png')