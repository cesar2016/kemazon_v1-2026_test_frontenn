from PIL import Image
import sys

def remove_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    # Get the color of the top-left pixel to assume it's the background
    bg_color = img.getpixel((0, 0))
    
    newData = []
    
    # Tolerance for color matching
    tolerance = 50 

    for item in datas:
        # Check distance to bg_color
        dist = sum([abs(item[i] - bg_color[i]) for i in range(3)])
        if dist < tolerance:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py input_path output_path")
    else:
        remove_background(sys.argv[1], sys.argv[2])
