# convert_pdf.py
import sys
from pdf2image import convert_from_path
import os

def convert_pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path)
    image_paths = []
    for i, image in enumerate(images):
        image_path = f"output_page_{i + 1}.png"
        image.save(image_path, 'PNG')
        image_paths.append(image_path)
    return image_paths

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert_pdf.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    image_paths = convert_pdf_to_images(pdf_path)
    for path in image_paths:
        print(path)
