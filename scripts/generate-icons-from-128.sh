#!/usr/bin/env bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    echo "  brew install imagemagick"
    exit 1
fi

# Check if input file is provided as a parameter
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <input_file>"
    exit 1
fi

# Input image file (taken from the first parameter)
input_file="$1"

# Extract size from the file name
input_size=$(echo "$input_file" | grep -oE '[0-9]+' | head -n1)

# Check if size is found
if [ -z "$input_size" ]; then
    echo "error: Unable to determinea input size from the file name."
    echo "file name should be, e.g.: myfile128.png"
    exit 1
fi

# Output file names
output_16="${input_file/$input_size/16}"
output_32="${input_file/$input_size/32}"
output_64="${input_file/$input_size/64}"

# Resize the image.
set -x
convert "$input_file" -resize 16x16 "$output_16"
convert "$input_file" -resize 32x32 "$output_32"
convert "$input_file" -resize 64x64 "$output_64"
