# import fileinput
import fileinput
import json
from PIL import Image, ImageDraw
  
for line in fileinput.input(files ='mandelbrot.json'):
    image = json.loads(line)
    width = len(image)
    height = len(image[0])
    im = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(im)

    for x in range(0, width):
        for y in range(0, height):
            colour = image[x][y]
            draw.point([x, y], (colour, colour, colour))
            
    im.save('output.png')