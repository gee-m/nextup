#!/bin/bash
# Script to extract JavaScript modules from task-tree.html
# This automates the extraction of ~5000+ lines of code into 20+ module files

SOURCE_FILE="/mnt/c/Users/gmmer/Documents/projects/graphdo/task-tree.html"

# Function to extract lines between two line numbers
extract_lines() {
    local start=$1
    local end=$2
    local output_file=$3
    sed -n "${start},${end}p" "$SOURCE_FILE" > "$output_file"
}

# Function to create module file with header
create_module() {
    local file_path=$1
    local order=$2
    local category=$3
    local description=$4
    local start_line=$5
    local end_line=$6

    # Create header
    cat > "$file_path" << EOF
/**
 * @order $order
 * @category $category
 * @description $description
 */

EOF

    # Extract and append the actual code
    sed -n "${start_line},${end_line}p" "$SOURCE_FILE" | \
    sed 's/^            //' >> "$file_path"

    echo "Created: $file_path (lines $start_line-$end_line)"
}

echo "Starting module extraction from task-tree.html..."
echo "Total lines in source: $(wc -l < "$SOURCE_FILE")"
echo

# This script will be populated with extraction commands
# For now, create the directory structure
mkdir -p src/js/{core,rendering,interactions,ui,navigation}

echo "Directory structure created"
echo "Module extraction commands will be added below..."
