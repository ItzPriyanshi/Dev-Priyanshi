# Use the official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json (bun.lockb is optional; Bun will generate it if missing)
COPY package.json .

# Install dependencies
RUN bun install

# Copy the rest of the source code
COPY . .

# Expose the port your API runs on
EXPOSE 4000

# Start the server (Bun supports TypeScript natively)
CMD ["bun", "index.ts"]