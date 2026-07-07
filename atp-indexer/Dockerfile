FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code (includes pre-generated providers.json)
COPY . .

# providers.json is generated from the repo-root providers/ dir by `yarn bootstrap` and must
# exist before the image is built (CI does this; local builds must too). Without it the
# /api/providers response silently loses all provider metadata.
RUN test -s src/api/data/providers.json || (echo "ERROR: src/api/data/providers.json missing or empty — run 'yarn bootstrap' before building" && exit 1)

# Generate Ponder types
RUN yarn codegen

# Expose port
EXPOSE 42068

# Default command
CMD ["yarn", "start"]
