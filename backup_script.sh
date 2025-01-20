#!/bin/bash

# Define the source and destination directories
source_dir="$PWD"

source_dir_name=${PWD##*/}

echo "source_dir_name: $source_dir_name"
new_name_dir="${source_dir_name}_backup_$(date +%Y%m%d_%H%M)"
echo "new folder name: $new_name_dir"

backup_dir="${source_dir}${new_name_dir}"

# Calculate the total size of the source directory before copying
total_size=$(du -s "$source_dir" | awk '{print $1}')

# Create a duplicate of the working directory with progress
echo "Copying files..."
copied_size=0

echo "Source folder size: $total_size"

cp -R "$source_dir" "$backup_dir" &
sleep 1

# Use a loop to check the size of the backup directory
while kill -0 $! 2>/dev/null; do
  copied_size=$(du -s "$backup_dir" | awk '{print $1}')
  if [ "$copied_size" -gt "$total_size" ]; then
    copied_size="$total_size"
  fi
  progress=$((copied_size * 100 / total_size))
  echo -ne "Progress: $progress% \r"
  sleep 1
done

# Rename the backup directory
# mv "$backup_dir" "${backup_dir}_processed"

# Find and delete "dist" and "node_modules" directories within subprojects
echo "Processing files..."
find "${backup_dir}" -depth -name "dist" -exec rm -rf {} \;
find "${backup_dir}" -depth -name "node_modules" -exec rm -rf {} \;

# Create a zip archive of the backup with progress
echo "Zipping files..."

# This works but creates subdirectory paths in the zip file
# zip -r "${backup_dir}.zip" "${backup_dir}" > /dev/null

# Tried these but they don't work
#(cd "${backup_dir}" && zip -r "../${backup_dir}.zip" .) > /dev/null
#zip -r "${backup_dir}.zip" -j "${backup_dir}/"* > /dev/null
#(cd "${backup_dir}" && zip -r "../${source_dir}/backup.zip" ./*)  > /dev/null

# This works
cd "${backup_dir}" && \
zip -r "../${new_name_dir}.zip" . * > /dev/null
cd ..

# Optionally remove the unzipped directory after zipping
# rm -rf "${backup_dir}"

echo "Backup created at ${backup_dir}.zip"