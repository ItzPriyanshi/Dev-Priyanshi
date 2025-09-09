# Use official Bun image
FROM jarredsumner/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json only (bun.lockb is optional)
COPY package.json .

# Install dependencies (Bun will create bun.lockb if it doesn't exist)
RUN bun install

# Copy the rest of the source code
COPY . .

# Expose the port your API runs on
EXPOSE 4000

# Start the server (TS supported natively)
CMD ["bun", "index.ts"]