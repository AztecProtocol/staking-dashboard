FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code (includes pre-generated providers.json)
COPY . .

# Generate Ponder types
RUN yarn codegen

# Expose port
EXPOSE 42068

# Default command
CMD ["yarn", "start"]
