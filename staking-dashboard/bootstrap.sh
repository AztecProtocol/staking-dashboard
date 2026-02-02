#! /bin/bash
set -eu

ROOT=$(git rev-parse --show-toplevel)
WEBSITE_ROOT=$ROOT/staking-dashboard

ACTION=${1:-"help"}

# Source centralized logging functions
source "$ROOT/scripts/logging.sh"

# Contract addresses can be provided via:
# 1. Environment variables (for CI/CD)
# 2. A local contract_addresses.json file (for local development)
# 3. Fetched from a remote source (for CI/CD with private repo)
CONTRACT_ADDRESSES_FILE="${CONTRACT_ADDRESSES_FILE:-}"

# Function to replace or add a variable in .env
update_env_var() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  
  if grep -q "^$key=" $env_file; then
    # Replace existing value
    sed -i.bak "s|^$key=.*|$key=$value|" $env_file
  else
    # Append if key not found
    echo "$key=$value" >> $env_file
  fi
}


# Load contract addresses from environment variables or JSON file
load_contract_addresses() {
  local environment="$1"

  # Priority 1: Environment variables (for CI/CD)
  if [ -n "${VITE_ATP_FACTORY_ADDRESS:-}" ]; then
    log_step "Using contract addresses from environment variables"
    return 0
  fi

  # Priority 2: Contract addresses JSON file (can be passed via CONTRACT_ADDRESSES_FILE env var)
  local contract_addresses_file="${CONTRACT_ADDRESSES_FILE:-}"

  # Priority 3: Look for local contract_addresses.json in the website root
  if [ -z "$contract_addresses_file" ] && [ -f "$WEBSITE_ROOT/contract_addresses.json" ]; then
    contract_addresses_file="$WEBSITE_ROOT/contract_addresses.json"
  fi

  if [ -n "$contract_addresses_file" ] && [ -f "$contract_addresses_file" ]; then
    log_step "Loading contract addresses from $contract_addresses_file"
    VITE_ATP_FACTORY_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpFactory')
    VITE_ATP_FACTORY_AUCTION_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpFactoryAuction')
    VITE_ATP_REGISTRY_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpRegistry')
    VITE_ATP_REGISTRY_AUCTION_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpRegistryAuction')
    VITE_STAKING_REGISTRY_ADDRESS=$(cat $contract_addresses_file | jq -r '.stakingRegistry')
    VITE_ROLLUP_ADDRESS=$(cat $contract_addresses_file | jq -r '.rollupAddress')
    VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpWithdrawableAndClaimableStaker')
    VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpWithdrawableAndClaimableStaker')
    VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS=$(cat $contract_addresses_file | jq -r '.atpWithdrawableAndClaimableStaker')
    VITE_GENESIS_SEQUENCER_SALE_ADDRESS=$(cat $contract_addresses_file | jq -r '.genesisSequencerSale')
    VITE_GOVERNANCE_ADDRESS=$(cat $contract_addresses_file | jq -r '.governanceAddress')
    VITE_GSE_ADDRESS=$(cat $contract_addresses_file | jq -r '.gseAddress')
    return 0
  fi

  echo "Error: Contract addresses not found."
  echo ""
  echo "Please provide contract addresses via one of the following methods:"
  echo "  1. Set environment variables (VITE_ATP_FACTORY_ADDRESS, etc.)"
  echo "  2. Set CONTRACT_ADDRESSES_FILE=/path/to/contract_addresses.json"
  echo "  3. Create a contract_addresses.json file in $WEBSITE_ROOT"
  echo ""
  echo "See .env.example for the list of required contract addresses."
  exit 1
}

function update_env_file() {
  local environment="$1"
  local green="${2:-""}"

  local env_file="$WEBSITE_ROOT/.env"

  if [ ! -f "$env_file" ]; then
    cp "$WEBSITE_ROOT/.env.example" "$env_file"
  fi

  # Load contract addresses from env vars or JSON file
  load_contract_addresses "$environment"
  log_step "Updating env file with contract addresses"

  if [ -z "${VITE_API_HOST:-}" ]; then
    log_step "Updating VITE_API_HOST"
    if [ "$environment" = "staging" ]; then
      if [ "$green" = "green" ]; then
        # staging green deployment
        VITE_API_HOST="https://d1lzkj24db7400.cloudfront.net"
      else
        # staging red deployment
        VITE_API_HOST="https://d24imfdgeak2db.cloudfront.net"
      fi
    elif [ "$environment" = "prod" ]; then
      if [ "$green" = "green" ]; then
        # prod green deployment
        VITE_API_HOST="https://dgk9duhuxabbq.cloudfront.net"
      else
        # prod red deployment
        VITE_API_HOST="https://d10cun7h2qqnvc.cloudfront.net"
      fi
    else 
      VITE_API_HOST="http://localhost:42068"
    fi
  fi

  # Set chain ID and RPC URL for sepolia
  if [ "$environment" = "sepolia" ]; then
    VITE_CHAIN_ID="11155111"
    VITE_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
  elif [ "$environment" = "sepolia_testnet" ]; then
    VITE_CHAIN_ID="11155111"
    VITE_RPC_URL=$TESTNET_RPC_URL
  elif [ "$environment" = "dev" ]; then
    VITE_CHAIN_ID="31337"
    VITE_RPC_URL="http://localhost:8545"
  else 
    VITE_CHAIN_ID="1"
    VITE_RPC_URL="https://ethereum-rpc.publicnode.com"
  fi

  # Always update contract addresses, chain ID, and RPC URL
  log_step "Updating VITE_CHAIN_ID: $VITE_CHAIN_ID"
  update_env_var $env_file "VITE_CHAIN_ID" "$VITE_CHAIN_ID"
  
  log_step "Updating VITE_RPC_URL: $VITE_RPC_URL"
  update_env_var $env_file "VITE_RPC_URL" "$VITE_RPC_URL"

  log_step "Updating VITE_API_HOST: $VITE_API_HOST"
  update_env_var $env_file "VITE_API_HOST" "$VITE_API_HOST"
  
  log_step "Updating VITE_ATP_FACTORY_ADDRESS: $VITE_ATP_FACTORY_ADDRESS"
  update_env_var $env_file "VITE_ATP_FACTORY_ADDRESS" "$VITE_ATP_FACTORY_ADDRESS"

  log_step "Updating VITE_ATP_FACTORY_AUCTION_ADDRESS: $VITE_ATP_FACTORY_AUCTION_ADDRESS"
  update_env_var $env_file "VITE_ATP_FACTORY_AUCTION_ADDRESS" "$VITE_ATP_FACTORY_AUCTION_ADDRESS"
  
  log_step "Updating VITE_ATP_REGISTRY_ADDRESS: $VITE_ATP_REGISTRY_ADDRESS"
  update_env_var $env_file "VITE_ATP_REGISTRY_ADDRESS" "$VITE_ATP_REGISTRY_ADDRESS"

  log_step "Updating VITE_ATP_REGISTRY_AUCTION_ADDRESS: $VITE_ATP_REGISTRY_AUCTION_ADDRESS"
  update_env_var $env_file "VITE_ATP_REGISTRY_AUCTION_ADDRESS" "$VITE_ATP_REGISTRY_AUCTION_ADDRESS"
  
  log_step "Updating VITE_STAKING_REGISTRY_ADDRESS: $VITE_STAKING_REGISTRY_ADDRESS"
  update_env_var $env_file "VITE_STAKING_REGISTRY_ADDRESS" "$VITE_STAKING_REGISTRY_ADDRESS"
  
  log_step "Updating VITE_ROLLUP_ADDRESS: $VITE_ROLLUP_ADDRESS"
  update_env_var $env_file "VITE_ROLLUP_ADDRESS" "$VITE_ROLLUP_ADDRESS"
  
  log_step "Updating VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS: $VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS"
  update_env_var $env_file "VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS" "$VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS"
  
  log_step "Updating VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS: $VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS"
  update_env_var $env_file "VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS" "$VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS"

  log_step "Updating VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS: $VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS"
  update_env_var $env_file "VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS" "$VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS"
  
  log_step "Updating VITE_GENESIS_SEQUENCER_SALE_ADDRESS: $VITE_GENESIS_SEQUENCER_SALE_ADDRESS"
  update_env_var $env_file "VITE_GENESIS_SEQUENCER_SALE_ADDRESS" "$VITE_GENESIS_SEQUENCER_SALE_ADDRESS"

  log_step "Updating VITE_GOVERNANCE_ADDRESS: $VITE_GOVERNANCE_ADDRESS"
  update_env_var $env_file "VITE_GOVERNANCE_ADDRESS" "$VITE_GOVERNANCE_ADDRESS"

  log_step "Updating VITE_GSE_ADDRESS: $VITE_GSE_ADDRESS"
  update_env_var $env_file "VITE_GSE_ADDRESS" "$VITE_GSE_ADDRESS"
}

function start() {
  local environment="${1:-"dev"}"
  local green="${2:-""}"

  update_env_file "$environment" "$green"

  # Install dependencies
  log_step "Installing dependencies"
  yarn

  # Start dev server
  log_step "Starting development server"
  yarn dev
}

function start_sepolia() {
  update_env_file "sepolia"

  # Install dependencies
  log_step "Installing dependencies"
  yarn

  # Start dev server
  log_step "Starting development server"
  yarn dev
}


function build() {
  # Install dependencies
  yarn

  update_env_file "sepolia"

  # Build the website
  yarn build --mode sepolia
}

function generate_docker_env() {
  local environment="$1"
  local env_docker_file="$WEBSITE_ROOT/.env.docker"

  log_step "Generating .env.docker file for $environment environment"

  # Load contract addresses from env vars or JSON file
  load_contract_addresses "$environment"

  # Set defaults for network configuration (can be overridden via environment variables)
  if [ "$environment" = "sepolia" ]; then
    VITE_CHAIN_ID="${VITE_CHAIN_ID:-11155111}"
    VITE_RPC_URL="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
    VITE_EXPLORER_URL="${VITE_EXPLORER_URL:-https://sepolia.etherscan.io}"
  elif [ "$environment" = "dev" ]; then
    VITE_CHAIN_ID="${VITE_CHAIN_ID:-31337}"
    VITE_RPC_URL="${VITE_RPC_URL:-http://localhost:8545}"
    VITE_EXPLORER_URL="${VITE_EXPLORER_URL:-https://sepolia.etherscan.io}"
  else 
    VITE_CHAIN_ID="${VITE_CHAIN_ID:-1}"
    VITE_RPC_URL="${VITE_RPC_URL:-https://ethereum-rpc.publicnode.com}"
    VITE_EXPLORER_URL="${VITE_EXPLORER_URL:-https://etherscan.io}"
  fi

  # Set defaults for other properties (can be overridden via environment variables)
  VITE_API_HOST="${VITE_API_HOST:-http://localhost:42068}"
  VITE_VALIDATOR_DASHBOARD_URL="${VITE_VALIDATOR_DASHBOARD_URL:-https://dashtec.xyz}"
  VITE_WALLETCONNECT_PROJECT_ID="${WALLETCONNECT_PROJECT_ID:-}"
  
  # TODO(md): we dont have this yet
  VITE_SAFE_API_KEY="${VITE_SAFE_API_KEY:-}"

  # Generate .env.docker file
  cat > $env_docker_file << EOF
# Generated by bootstrap.sh for Docker deployment

# Network Configuration
VITE_CHAIN_ID=$VITE_CHAIN_ID
VITE_RPC_URL=$VITE_RPC_URL
VITE_EXPLORER_URL=$VITE_EXPLORER_URL

# Contract Addresses
VITE_ATP_FACTORY_ADDRESS=$VITE_ATP_FACTORY_ADDRESS
VITE_ATP_FACTORY_AUCTION_ADDRESS=$VITE_ATP_FACTORY_AUCTION_ADDRESS
VITE_ATP_REGISTRY_ADDRESS=$VITE_ATP_REGISTRY_ADDRESS
VITE_ATP_REGISTRY_AUCTION_ADDRESS=$VITE_ATP_REGISTRY_AUCTION_ADDRESS
VITE_STAKING_REGISTRY_ADDRESS=$VITE_STAKING_REGISTRY_ADDRESS
VITE_ROLLUP_ADDRESS=$VITE_ROLLUP_ADDRESS
VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS=$VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS
VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS=$VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS
VITE_GENESIS_SEQUENCER_SALE_ADDRESS=$VITE_GENESIS_SEQUENCER_SALE_ADDRESS
VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS=$VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS
VITE_GOVERNANCE_ADDRESS=$VITE_GOVERNANCE_ADDRESS
VITE_GSE_ADDRESS=$VITE_GSE_ADDRESS

# API Configuration
VITE_API_HOST=$VITE_API_HOST
VITE_SAFE_API_KEY=$VITE_SAFE_API_KEY

# External Services
VITE_VALIDATOR_DASHBOARD_URL=$VITE_VALIDATOR_DASHBOARD_URL
VITE_WALLETCONNECT_PROJECT_ID=$VITE_WALLETCONNECT_PROJECT_ID

# Environment
NODE_ENV=production
EOF

  log_success "✓ Generated $env_docker_file"
}

function update_env_file_deploy() {
  local environment="${1:-"sepolia"}"
  local green="${2:-""}"

  # Update the env file
  update_env_file "$environment"
  log_step "Updating VITE_RPC_URL"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_RPC_URL" "$RPC_URL"
  log_step "Updating VITE_EXPLORER_URL"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_EXPLORER_URL" "$VITE_EXPLORER_URL"
  log_step "Updating VITE_CHAIN_ID"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_CHAIN_ID" "$CHAIN_ID"
  log_step "Updating VITE_WALLETCONNECT_PROJECT_ID"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_WALLETCONNECT_PROJECT_ID" $WALLETCONNECT_PROJECT_ID
  log_step "Updating VITE_API_HOST"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_API_HOST" $VITE_API_HOST
  log_step "Updating VITE_VALIDATOR_DASHBOARD_URL"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_VALIDATOR_DASHBOARD_URL" "https://dashtec.xyz"
  log_step "Updating VITE_SAFE_API_KEY"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_SAFE_API_KEY" $VITE_SAFE_API_KEY
  log_step "Updating VITE_GENESIS_SEQUENCER_SALE_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_GENESIS_SEQUENCER_SALE_ADDRESS" $VITE_GENESIS_SEQUENCER_SALE_ADDRESS
  log_step "Updating VITE_ATP_FACTORY_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_FACTORY_ADDRESS" $VITE_ATP_FACTORY_ADDRESS
  log_step "Updating VITE_ATP_FACTORY_AUCTION_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_FACTORY_AUCTION_ADDRESS" $VITE_ATP_FACTORY_AUCTION_ADDRESS
  log_step "Updating VITE_ATP_REGISTRY_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_REGISTRY_ADDRESS" $VITE_ATP_REGISTRY_ADDRESS
  log_step "Updating VITE_ATP_REGISTRY_AUCTION_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_REGISTRY_AUCTION_ADDRESS" $VITE_ATP_REGISTRY_AUCTION_ADDRESS
  log_step "Updating VITE_STAKING_REGISTRY_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_STAKING_REGISTRY_ADDRESS" $VITE_STAKING_REGISTRY_ADDRESS
  log_step "Updating VITE_ROLLUP_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ROLLUP_ADDRESS" $VITE_ROLLUP_ADDRESS
  log_step "Updating VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS" $VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS
  log_step "Updating VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS" $VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS
  log_step "Updating VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS" $VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS
  log_step "Updating VITE_GENESIS_SEQUENCER_SALE_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_GENESIS_SEQUENCER_SALE_ADDRESS" $VITE_GENESIS_SEQUENCER_SALE_ADDRESS
  log_step "Updating VITE_GOVERNANCE_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_GOVERNANCE_ADDRESS" $VITE_GOVERNANCE_ADDRESS
  log_step "Updating VITE_GSE_ADDRESS"
  update_env_var "$WEBSITE_ROOT/.env.$environment" "VITE_GSE_ADDRESS" $VITE_GSE_ADDRESS

  echo "Contents of $WEBSITE_ROOT/.env.$environment:"
  cat "$WEBSITE_ROOT/.env.$environment"
}

function docker_deploy() {
  local environment="${1:-sepolia}"

  log_step "Starting Docker deployment for $environment environment"

  # Generate .env.docker
  generate_docker_env "$environment"

  # Build and run with docker compose
  log_step "Building and starting Docker containers..."
  docker compose up -d --build

  echo ""
  log_success "✓ Docker deployment complete!"
  echo "Application is running at http://localhost:5173"
  echo ""
  echo "Useful commands:"
  echo "  docker compose logs -f              View logs"
  echo "  docker compose ps                   Check status"
  echo "  docker compose down                 Stop containers"
  echo "  docker compose restart              Restart containers"
}

function deploy() {
  local environment=${1:-"dev"}
  local indexer_deployment_suffix="${2:-""}"

  log_step "Deploying Staking Dashboard to $environment environment with indexer deployment suffix: $indexer_deployment_suffix
..."

  if [ -z "${AWS_ACCOUNT:-}" ]; then
    echo "Error: AWS_ACCOUNT must be set"
    exit 1
  fi

  if [ -z "${BASIC_AUTH_USER:-}" ] || [ -z "${BASIC_AUTH_PASSWORD:-}" ]; then
    echo "Error: BASIC_AUTH_USER and BASIC_AUTH_PASSWORD environment variables must be set"
    exit 1
  fi

  if [ "$environment" = "dev" ]; then
    if [ -z "${SEPOLIA_RPC_URL:-}" ]; then
      echo "Error: SEPOLIA_RPC_URL environment variable must be set"
      exit 1
    fi
    RPC_URL=$SEPOLIA_RPC_URL
    CHAIN_ID=11155111
    chain_environment="sepolia_testnet" # TODO: Change to sepolia (temp-hack)
    VITE_EXPLORER_URL="https://sepolia.etherscan.io"
  fi

  if [ "$environment" = "dev-tn" ]; then
    if [ -z "${TESTNET_RPC_URL:-}" ]; then
      echo "Error: TESTNET_RPC_URL environment variable must be set"
      exit 1
    fi
    RPC_URL=$TESTNET_RPC_URL
    CHAIN_ID=11155111
    chain_environment="sepolia_testnet"
    VITE_EXPLORER_URL="https://sepolia.etherscan.io"
  fi

  if [ "$environment" = "staging" ]; then
    if [ -z "${RPC_URL:-}" ]; then
      echo "Error: RPC_URL environment variable must be set"
      exit 1
    fi
    RPC_URL=$RPC_URL
    CHAIN_ID=1
    chain_environment="staging"
    VITE_EXPLORER_URL="https://etherscan.io"
  fi

  if [ "$environment" = "prod" ]; then
    if [ -z "${RPC_URL:-}" ]; then
      echo "Error: RPC_URL environment variable must be set"
      exit 1
    fi
    RPC_URL=$RPC_URL
    CHAIN_ID=1
    chain_environment="prod"
    VITE_EXPLORER_URL="https://etherscan.io"
  fi

  if [ -z "${WALLETCONNECT_PROJECT_ID:-}" ]; then
    echo "Error: WALLETCONNECT_PROJECT_ID environment variable must be set"
    exit 1
  fi

  local region="eu-west-2"

  # Initialize Terraform with the S3 backend
  (cd terraform && terraform init \
    -backend-config="bucket=aztec-token-sale-terraform-state" \
    -backend-config="key=$environment-aztec-staking-dashboard/terraform.tfstate" \
    -backend-config="region=$region" \
    -backend-config="encrypt=true" \
  )

  # Run terraform
  export TF_VAR_env=$environment
  export TF_VAR_region=$region
  export TF_VAR_basic_auth_user=$BASIC_AUTH_USER
  export TF_VAR_basic_auth_pass=$BASIC_AUTH_PASSWORD

  if [ "${DRY_RUN:-false}" = "true" ]; then
    # Dry-run mode: plan and save to terraform-plans directory
    PLAN_DIR="$ROOT/terraform-plans"
    mkdir -p "$PLAN_DIR"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    PLAN_FILE="$PLAN_DIR/staking-dashboard-${environment}-${TIMESTAMP}.json"
    PLAN_BINARY="$PLAN_DIR/staking-dashboard-${environment}-${TIMESTAMP}.plan"
    log_step "DRY_RUN: Planning terraform for staking-dashboard ($environment), saving to $PLAN_FILE"
    (cd terraform && terraform plan -out="$PLAN_BINARY")
    (cd terraform && terraform show -json "$PLAN_BINARY" > "$PLAN_FILE")
    log_success "Plan saved to $PLAN_FILE"
    return 0
  fi

  # Apply the terraform configuration
  (cd terraform && terraform apply -auto-approve -var="indexer_deployment_suffix=$indexer_deployment_suffix")

  # Get ATP indexer URL from terraform output, fallback to localhost if not available
  ATP_INDEXER_URL=$(cd $WEBSITE_ROOT/terraform && terraform output -raw atp_indexer_url)

  # TODO: Remove this.
  # Use dev-tn indexer URL for dev environment. 
  # This is because website for dev-tn cannot be deployed due to broken tfstate.
  if [ "$environment" = "dev" ]; then
    echo "WARNING:Using hardcoded dev-tn indexer URL"
    ATP_INDEXER_URL="https://d1ibwybv6l4hzw.cloudfront.net"
  fi

  echo "ATP_INDEXER_URL: $ATP_INDEXER_URL"
  export VITE_API_HOST="$ATP_INDEXER_URL"
  export VITE_CHAIN_ID=$CHAIN_ID
  export VITE_RPC_URL=$RPC_URL

  # Update the env file
  
  update_env_file_deploy "$chain_environment"
  (cat $WEBSITE_ROOT/.env.$chain_environment)

  # Build the website
  yarn install
  yarn build --mode $chain_environment

  # Upload build to S3
  aws s3 sync $WEBSITE_ROOT/dist s3://$environment-aztec-staking-dashboard --delete

  # Invalidate the CloudFront distribution
  DISTRIBUTION_ID=$(cd terraform && terraform output -raw staking_dashboard_distribution_id)
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --no-cli-pager

  log_success "Deployed to https://$(cd terraform && terraform output -raw cloudfront_domain_name)"
}

case $ACTION in
  dev)
      start "dev"
      ;;
  dev-staging)
      start "staging"
      ;;
  dev-staging-green)
      start "staging" "green"
      ;;
  dev-prod)
      start "prod"
      ;;
  dev-prod-green)
      start "prod" "green"
      ;;
  sepolia)
      start_sepolia
      ;;
  build)
      build
      ;;
  deploy)
      deploy "dev"
      ;;
  deploy-green)
      deploy "dev" "-green"
      ;;
  deploy-testnet)
      deploy "dev-tn"
      ;;
  deploy-staging)
      deploy "staging"
      ;;
  deploy-staging-green)
      deploy "staging" "-green"
      ;;
  deploy-prod)
      deploy "prod"
      ;;
  deploy-prod-green)
      deploy "prod" "-green"
      ;;
  docker)
      docker_deploy "sepolia"
      ;;
  help|*)
      echo "Usage: $0 [ACTION]"
      echo ""
      echo "Available actions:"
      echo "  dev                     Start local development using the dev network addresses"
      echo "  dev-staging             Start local development using the staging indexer"
      echo "  dev-staging-green       Start local development using the staging green indexer"
      echo "  dev-prod                Start local development using the prod red indexer"
      echo "  dev-prod-green          Start local development using the prod green indexer"
      echo "  sepolia                 Start local development using the sepolia network addresses"
      echo "  build                   Build the website"
      echo "  deploy                  Deploy the website to dev environment"
      echo "  deploy-testnet          Deploy the website to testnet environment (sepolia testnet)"
      echo "  deploy-staging          Deploy the website to staging environment with red indexer"
      echo "  deploy-staging-green    Deploy the website to staging environment with green indexer"
      echo "  deploy-prod             Deploy the website to prod environment"
      echo "  deploy-prod-green       Deploy the website to prod environment with green indexer"
      echo "  docker                  Run with Docker (sepolia environment)"
      echo "  help                    Show this help message"
      echo ""
      echo "Local Development Setup:"
      echo "  Contract addresses can be provided via:"
      echo "    1. Environment variables (VITE_ATP_FACTORY_ADDRESS, etc.)"
      echo "    2. CONTRACT_ADDRESSES_FILE=/path/to/contract_addresses.json"
      echo "    3. Create contract_addresses.json in this directory"
      echo ""
      echo "  Example contract_addresses.json:"
      echo "    {"
      echo "      \"atpFactory\": \"0x...\","
      echo "      \"atpFactoryAuction\": \"0x...\","
      echo "      \"atpRegistry\": \"0x...\","
      echo "      \"atpRegistryAuction\": \"0x...\","
      echo "      \"stakingRegistry\": \"0x...\","
      echo "      \"rollupAddress\": \"0x...\","
      echo "      \"atpWithdrawableAndClaimableStaker\": \"0x...\","
      echo "      \"genesisSequencerSale\": \"0x...\","
      echo "      \"governanceAddress\": \"0x...\","
      echo "      \"gseAddress\": \"0x...\""
      echo "    }"
      echo ""
      echo "  For production contract addresses, contact the Aztec team."
      ;;
esac

exit 0