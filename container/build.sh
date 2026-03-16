#!/bin/bash
# Build the CloseClaw agent container image

set -e

IMAGE_NAME=${CONTAINER_IMAGE:-closeclaw-agent:latest}

echo "Building container image: $IMAGE_NAME"

# Get the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Build the container
docker build -t "$IMAGE_NAME" "$PROJECT_ROOT/container"

echo "✓ Container image built successfully: $IMAGE_NAME"
echo ""
echo "You can now run CloseClaw with:"
echo "  npm start"
