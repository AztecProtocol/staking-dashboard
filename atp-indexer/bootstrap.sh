#!/bin/bash
set -eu

ROOT=$(git rev-parse --show-toplevel)
BACKEND_ROOT=$ROOT/atp-indexer

ACTION=${1:-"help"}
ENVIRONMENT=${2:-"testnet"}

# Source centralized logging functions
source "$ROOT/scripts/logging.sh"

# Contract addresses can be provided via:
# 1. Environment variables (for CI/CD)
# 2. A local contract_addresses.json file (for local development)
CONTRACT_ADDRESSES_FILE="${CONTRACT_ADDRESSES_FILE:-}"

# Validate environment
if [ "$ENVIRONMENT" != "testnet" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Error: Environment must be 'testnet' or 'prod'"
  exit 1
fi

# Database configuration variables (can be overridden by environment)
DB_NAME="${DB_NAME:-aztec_staking}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# API configuration (can be overridden by environment)
PORT="${PORT:-42068}"

function start_pg() {
  docker run --rm -d --name postgres2 -p 5431:5432 -e POSTGRES_PASSWORD=postgres postgres:16.8
  export POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@127.0.0.1:5431/postgres

  trap "echo 'Stopping pg...'; docker container rm -f postgres" EXIT INT TERM
}

# Extract contract addresses from environment variables or JSON file
get_contract_addresses() {
  local environment="$1"

  # Priority 1: Environment variables (for CI/CD)
  if [ -n "${ATP_FACTORY_ADDRESS:-}" ]; then
    log_step "Using contract addresses from environment variables"
    # Ensure all required addresses are set
    ATP_REGISTRY_ADDRESS="${ATP_REGISTRY_ADDRESS:-}"
    ATP_REGISTRY_AUCTION_ADDRESS="${ATP_REGISTRY_AUCTION_ADDRESS:-}"
    ATP_FACTORY_AUCTION_ADDRESS="${ATP_FACTORY_AUCTION_ADDRESS:-}"
    STAKING_REGISTRY_ADDRESS="${STAKING_REGISTRY_ADDRESS:-}"
    ROLLUP_ADDRESS="${ROLLUP_ADDRESS:-}"
    START_BLOCK="${START_BLOCK:-0}"
    return 0
  fi

  # Priority 2: Contract addresses JSON file (can be passed via CONTRACT_ADDRESSES_FILE env var)
  local contract_addresses_file="${CONTRACT_ADDRESSES_FILE:-}"

  # Priority 3: Look for local contract_addresses.json in the backend root
  if [ -z "$contract_addresses_file" ] && [ -f "$BACKEND_ROOT/contract_addresses.json" ]; then
    contract_addresses_file="$BACKEND_ROOT/contract_addresses.json"
  fi

  if [ -n "$contract_addresses_file" ] && [ -f "$contract_addresses_file" ]; then
    log_step "Loading contract addresses from $contract_addresses_file"

    # factories
    ATP_FACTORY_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpFactory')
    ATP_REGISTRY_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpRegistry')

    # registries
    ATP_REGISTRY_AUCTION_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpRegistryAuction')
    ATP_FACTORY_AUCTION_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpFactoryAuction')

    # other
    STAKING_REGISTRY_ADDRESS=$(cat $contract_addresses_file | jq -r '.stakingRegistry')
    ROLLUP_ADDRESS=$(cat $contract_addresses_file | jq -r '.rollupAddress')

    # For dev environment, use 0 to catch all events
    # For other environments, use atpFactoryDeploymentBlock as the starting point
    if [ "$environment" = "dev" ]; then
      START_BLOCK=0
    else
      START_BLOCK=$(cat $contract_addresses_file | jq -r '.atpFactoryDeploymentBlock // 0')
    fi
    return 0
  fi

  echo "Error: Contract addresses not found."
  echo ""
  echo "Please provide contract addresses via one of the following methods:"
  echo "  1. Set environment variables (ATP_FACTORY_ADDRESS, etc.)"
  echo "  2. Set CONTRACT_ADDRESSES_FILE=/path/to/contract_addresses.json"
  echo "  3. Create a contract_addresses.json file in $BACKEND_ROOT"
  echo ""
  echo "See .env.example for the list of required contract addresses."
  exit 1
}

# Get network configuration for environment
get_network_config() {
  local environment="$1"

  # Set defaults based on environment, but allow env override
  case $environment in
    dev)
      CHAIN_ID="${CHAIN_ID:-31337}"
      RPC_URL="${RPC_URL:-http://localhost:8545}"
      ;;
    sepolia)
      CHAIN_ID="${CHAIN_ID:-11155111}"
      RPC_URL="${RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
      ;;
    mainnet)
      CHAIN_ID="${CHAIN_ID:-1}"
      RPC_URL="${RPC_URL:-https://ethereum-rpc.publicnode.com}"
      ;;
    *)
      echo "Error: Unknown environment: $environment"
      exit 1
      ;;
  esac
}

# Create .env file
create_env() {
  local env="$1"

  get_contract_addresses "$env"
  get_network_config "$env"

  if [ "$env" = "dev" ]; then
    # Just use the sqlite when local
    POSTGRES_CONNECTION_STRING= 
  else
    POSTGRES_CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  fi


  cat > "$BACKEND_ROOT/.env" << EOF
# Database
POSTGRES_CONNECTION_STRING=${POSTGRES_CONNECTION_STRING}

# Blockchain
RPC_URL=${RPC_URL}
CHAIN_ID=${CHAIN_ID}

# Contract addresses
ATP_FACTORY_ADDRESS=${ATP_FACTORY_ADDRESS}
ATP_FACTORY_AUCTION_ADDRESS=${ATP_FACTORY_AUCTION_ADDRESS}
STAKING_REGISTRY_ADDRESS=${STAKING_REGISTRY_ADDRESS}
ROLLUP_ADDRESS=${ROLLUP_ADDRESS}

# Ponder settings
START_BLOCK=${START_BLOCK}

# API
PORT=${PORT}

# Application
NODE_ENV=development
LOG_LEVEL=info

EOF
}

# Create Docker-specific environment file
create_docker_env() {
  local environment="$1"
  local docker_env_file="$BACKEND_ROOT/.env.docker"

  get_contract_addresses "$environment"
  get_network_config "$environment"

  cat > "$docker_env_file" << EOF
# Database
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Blockchain
RPC_URL=${RPC_URL}
CHAIN_ID=${CHAIN_ID}

# Contract addresses
ATP_FACTORY_ADDRESS=${ATP_FACTORY_ADDRESS}
ATP_FACTORY_AUCTION_ADDRESS=${ATP_FACTORY_AUCTION_ADDRESS}
STAKING_REGISTRY_ADDRESS=${STAKING_REGISTRY_ADDRESS}
ROLLUP_ADDRESS=${ROLLUP_ADDRESS}

# Indexer settings
START_BLOCK=${DEFAULT_START_BLOCK}
BLOCK_BATCH_SIZE=${DEFAULT_BLOCK_BATCH_SIZE}
POLLING_INTERVAL=${DEFAULT_POLLING_INTERVAL}
MAX_RETRIES=${DEFAULT_MAX_RETRIES}
PARALLEL_BATCHES=${DEFAULT_PARALLEL_BATCHES}

# API
API_PORT=${API_PORT}

# Application
NODE_ENV=production
LOG_LEVEL=info
EOF

  log_success "Created .env.docker file for Docker Compose"
}

function build() {
  cd "$BACKEND_ROOT"

  log_step "Building with cache reset..."

  # Install dependencies
  log_step "Installing dependencies"
  yarn install

  # Clean build cache
  log_step "Cleaning build cache"
  rm -rf dist node_modules/.cache

  # Aggregate provider metadata
  log_step "Aggregating provider metadata"

  # call separate provider bootstrap script if environment is testnet
  if [ "$ENVIRONMENT" = "testnet" ]; then
    yarn bootstrap-testnet
  else
    yarn bootstrap
  fi

  # Build TypeScript
  log_step "Building TypeScript"
  yarn codegen

  log_success "✓ Build complete"
}

function setup() {
  local env="$1"

  log_step "Setting up Ponder for $env..."
  cd "$BACKEND_ROOT"

  # Install dependencies
  if [ ! -d "node_modules" ]; then
    log_step "Installing dependencies..."
    yarn install
  fi

  # Create .env
  create_env "$env"

  # Generate providers.json
  log_step "Generating providers.json..."
  yarn bootstrap

  # Generate Ponder types
  log_step "Generating Ponder types..."
  yarn codegen

  echo ""
  echo "✓ Setup complete!"
  echo ""
  echo "Start with: ./bootstrap.sh docker $env"
}

function dev() {
  local env="dev"

  log_step "Setting up Ponder for $env..."
  cd "$BACKEND_ROOT"

  # Install dependencies
  log_step "Installing dependencies..."
  yarn install

  # Create .env
  create_env "$env"

  # Generate providers.json
  log_step "Generating providers.json..."
  yarn bootstrap

  # Generate Ponder types
  log_step "Generating Ponder types..."
  yarn codegen

  log_success "✓ Dev setup complete - running dev server..."

  yarn dev
}

function deploy() {
  local infra_environment=${1:-"testnet"}
  local deployment_suffix=${2:-""}
  log_step "Deploying ATP Indexer to $infra_environment environment with deployment suffix $deployment_suffix"

  if [ -z "${AWS_ACCOUNT:-}" ]; then
    echo "Error: AWS_ACCOUNT must be set"
    exit 1
  fi

  if [ -z "${AWS_REGION:-}" ]; then
    echo "Error: AWS_REGION must be set"
    exit 1
  fi

  if [ "$infra_environment" = "testnet" ]; then
    if [ -z "${TESTNET_RPC_URL:-}" ]; then
      echo "Error: TESTNET_RPC_URL must be set"
      exit 1
    fi
    RPC_URL=$TESTNET_RPC_URL
    CHAIN_ID=11155111
    chain_environment="sepolia_testnet"
    infra_parent_environment="dev"
  fi

  if [ "$infra_environment" = "prod" ]; then
    if [ -z "${RPC_URL:-}" ]; then
      echo "Error: RPC_URL must be set"
      exit 1
    fi
    RPC_URL=$RPC_URL
    CHAIN_ID=1
    chain_environment="prod"
    infra_parent_environment="prod"
  fi

  yarn install --frozen-lockfile
  if [ "$infra_environment" = "testnet" ]; then
    yarn bootstrap-testnet
  else
    yarn bootstrap
  fi

  # Load contract addresses from environment variables or JSON file
  # For CI/CD, these should be passed as environment variables
  get_contract_addresses "$chain_environment"

  # Ensure START_BLOCK is set for deployment
  START_BLOCK="${START_BLOCK:-0}"

  # Initialize Terraform with the S3 backend
  (cd terraform && terraform init \
    -backend-config="${infra_environment}${deployment_suffix}.tfbackend"
  )

  # Downsize DB resources for non-prod environments (defaults are prod-safe)
  if [ "$infra_environment" != "prod" ]; then
    DB_INSTANCE_CLASS=${TF_VAR_db_instance_class:-db.t4g.medium}
    DB_READ_REPLICA_COUNT=${TF_VAR_db_read_replica_count:-0}
  else
    # Use defaults from variables.tf for prod (db.r7g.2xlarge, 2 replicas)
    DB_INSTANCE_CLASS=${TF_VAR_db_instance_class:-db.r7g.2xlarge}
    DB_READ_REPLICA_COUNT=${TF_VAR_db_read_replica_count:-3}
  fi

  local args="-var=rpc_url=$RPC_URL \
    -var=atp_factory_address=$ATP_FACTORY_ADDRESS \
    -var=atp_factory_auction_address=$ATP_FACTORY_AUCTION_ADDRESS \
    -var=staking_registry_address=$STAKING_REGISTRY_ADDRESS \
    -var=rollup_address=$ROLLUP_ADDRESS \
    -var=start_block=$START_BLOCK \
    -var=db_password_ssm_name=/atp-indexer/${infra_environment}${deployment_suffix}/db_password \
    -var=db_instance_class=$DB_INSTANCE_CLASS \
    -var=db_read_replica_count=$DB_READ_REPLICA_COUNT \
    -var=chain_id=$CHAIN_ID \
    -var=deployment_suffix=$deployment_suffix" 

  echo "args: $args"
  
  export TF_VAR_env=$infra_environment
  # for the testnet - we deploy into the dev cluster etc, but use a different tf state file
  export TF_VAR_env_parent=$infra_parent_environment

  echo "TF_VAR_env: $TF_VAR_env"
  echo "TF_VAR_env_parent: $TF_VAR_env_parent"

  if [ "${DRY_RUN:-false}" = "true" ]; then
    # Dry-run mode: plan and save to terraform-plans directory
    PLAN_DIR="$ROOT/terraform-plans"
    mkdir -p "$PLAN_DIR"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    PLAN_FILE="$PLAN_DIR/atp-indexer-${infra_environment}-${TIMESTAMP}.json"
    PLAN_BINARY="$PLAN_DIR/atp-indexer-${infra_environment}-${TIMESTAMP}.plan"
    log_step "DRY_RUN: Planning terraform for atp-indexer ($infra_environment), saving to $PLAN_FILE"
    (cd terraform && terraform plan -out="$PLAN_BINARY" $args)
    (cd terraform && terraform show -json "$PLAN_BINARY" > "$PLAN_FILE")
    log_success "Plan saved to $PLAN_FILE"
    return 0
  fi

  (cd terraform && terraform apply -auto-approve $args)

  # Push the app to the ECR
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
  ECR=$(cd terraform && terraform output -raw ecr_repository_url)
  TAG=latest

  docker build -t $ECR:$TAG .
  docker push $ECR:$TAG

  # Update the ECR image tag in the Terraform configuration
  (cd terraform && terraform apply -auto-approve $args -var="ecr_image_tag=$TAG")

  ECS_SERVICE_ARN=$(cd terraform && terraform output -raw ecs_service_arn)
  ECS_INDEXER_SERVICE_ARN=$(cd terraform && terraform output -raw ecs_service_indexer_arn)
  aws ecs update-service --cluster ignition-backend-infra-$infra_parent_environment-cluster --service $ECS_SERVICE_ARN --force-new-deployment --no-cli-pager
  aws ecs update-service --cluster ignition-backend-infra-$infra_parent_environment-cluster --service $ECS_INDEXER_SERVICE_ARN --force-new-deployment --no-cli-pager
  log_success "Completed deployment of ATP Indexer to $infra_environment (parent environment: $infra_parent_environment) environment"
}

case $ACTION in
  dev)
      dev
      ;;
  build)
      build
      ;;
  deploy-testnet)
      deploy "testnet"
      ;;
  deploy-testnet-green)
      deploy "testnet" "-g"
      ;;
  deploy-prod)
      deploy "prod"
      ;;
  deploy-prod-green)
      deploy "prod" "-g"
      ;;
  help|*)
    echo "Usage: ./bootstrap.sh [ACTION] [ENVIRONMENT]"
      echo ""
    echo "Actions:"
    echo "  dev        Start development server"
    echo "  build      Install deps, generate providers & types"
    echo "  deploy-testnet     Deploy to testnet"
    echo "  deploy-prod     Deploy to prod"
    echo "  help       Show this help"
      echo ""
    echo "Environments:"
    echo "  testnet    Sepolia testnet (with testnet contract addresses)"
    echo "  mainnet    Ethereum mainnet"
      echo ""
      echo "Examples:"
    echo "  # Start development server"
      echo "  ./bootstrap.sh dev"
      echo ""
    echo "  # Build only"
    echo "  ./bootstrap.sh build"
      echo ""
    echo "Custom RPC:"
    echo "  RPC_URL=https://sepolia.infura.io/v3/KEY ./bootstrap.sh dev"
      echo ""
      echo "Environment Variables:"
    echo "  DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT"
    echo "  RPC_URL, CHAIN_ID, START_BLOCK"
    echo "  PORT"
      echo ""
    echo "Contract Addresses:"
    echo "  Contract addresses can be provided via:"
    echo "    1. Environment variables (ATP_FACTORY_ADDRESS, etc.)"
    echo "    2. CONTRACT_ADDRESSES_FILE=/path/to/contract_addresses.json"
    echo "    3. Create contract_addresses.json in this directory"
      echo ""
    echo "  Required contract address variables:"
    echo "    ATP_FACTORY_ADDRESS, ATP_FACTORY_AUCTION_ADDRESS"
    echo "    ATP_REGISTRY_ADDRESS, ATP_REGISTRY_AUCTION_ADDRESS"
    echo "    STAKING_REGISTRY_ADDRESS, ROLLUP_ADDRESS"
    echo "    START_BLOCK (optional, defaults to 0)"
      echo ""
    echo "  For production contract addresses, contact the Aztec team."
      ;;
esac

exit 0