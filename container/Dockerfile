# CloseClaw Agent Container
# Runs Claude Code CLI in an isolated environment

FROM node:20-slim

# Set working directory
WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 node

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Set up entrypoint script
COPY <<EOF /entrypoint.sh
#!/bin/bash
set -e

# Source environment variables if available
if [ -f /workspace/env-dir/env ]; then
    source /workspace/env-dir/env
fi

# Run the command
exec "\$@"
EOF

RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER node

# Set HOME for Claude Code session storage
ENV HOME=/home/node

# Default entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["claude"]
