#!/bin/sh

PORT=8080

# Check if port 8080 is in use
if lsof -i :8080 >/dev/null; then
  echo "Port 8080 is in use. Finding an available port..."
  PORT=$(comm -23 <(seq 8000 9000) <(lsof -i -P -n | grep LISTEN | awk '{print $9}' | cut -d: -f2) | head -n 1)
  echo "Using port $PORT instead."
fi

docker build -t my-node-server .

docker run --rm -it -p $PORT:8080 my-node-server