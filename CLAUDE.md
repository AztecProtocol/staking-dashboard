# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo for the Aztec Staking Dashboard, made up of two independent yarn workspaces plus shared data and infra:

- `staking-dashboard/` — React 19 + Vite + TypeScript frontend (RainbowKit / wagmi / viem). Talks to Ethereum via RPC and to the indexer via REST.
- `atp-indexer/` — Ponder-based blockchain indexer with a Hono REST API on top. Indexes ATP factories, the staking registry, the rollup, and dynamic ATP/Staker contracts created at runtime.
- `providers/` and `providers-testnet/` — One JSON file per provider (name, logo, self-stake addresses, etc.). These are aggregated into the indexer at build time by `atp-indexer/scripts/aggregate-providers*.ts` and served from `/api/providers`.
- `scripts/logging.sh` — Shared bash logging helpers sourced by both `bootstrap.sh` scripts.
- `terraform/` — Shared infra; each workspace also has its own `terraform/` directory used by its `bootstrap.sh deploy-*` actions.
- `db-schemas.json` — Maps the active Ponder DB schema name per environment (e.g. `atp-indexer-prod-v20`). Bumped when the schema changes.

There is no root `package.json`. Run `yarn` inside `staking-dashboard/` or `atp-indexer/` separately. Both use yarn 1.22 and require Node >=18.14 (frontend prefers v20+/v22).

## Common commands

### Frontend (`cd staking-dashboard`)

```bash
yarn install
yarn dev               # Vite dev server on http://localhost:5173
yarn build             # tsc -b && vite build (validates required VITE_* env vars)
yarn lint              # eslint .
yarn type-check        # tsc --noEmit
yarn format            # prettier write (skips src/contracts/abis/**)
```

The Vite build is gated on a list of required `VITE_*` env vars (see `vite.config.ts`). It will throw with a list of missing variables rather than producing a broken bundle.

The path alias `@/*` resolves to `staking-dashboard/src/*`.

### Frontend bootstrap script

`./bootstrap.sh <action>` wraps env-file generation, install, and `yarn dev`/`yarn build`. Common actions:

- `./bootstrap.sh dev` — uses dev (anvil 31337) network addresses and the local indexer
- `./bootstrap.sh sepolia` — uses Sepolia + the public Sepolia indexer
- `./bootstrap.sh dev-testnet` / `dev-prod` — local dev pointing at a deployed indexer
- `./bootstrap.sh docker` — builds and runs the frontend container (sepolia env)
- `./bootstrap.sh deploy-testnet` / `deploy-prod` — Terraform + S3 + CloudFront deploy (requires AWS creds, `WALLETCONNECT_PROJECT_ID`, and `RPC_URL`/`TESTNET_RPC_URL`)

### Indexer (`cd atp-indexer`)

```bash
yarn install
yarn bootstrap          # aggregate providers/*.json -> src/api/data/providers.json
yarn bootstrap-testnet  # same, but reads providers-testnet/
yarn codegen            # ponder codegen (regenerate types)
yarn dev                # rm -rf .ponder generated && ponder dev (port 42068 by default)
yarn start              # ponder start (production)
yarn serve              # ponder serve (API only)
yarn test               # jest
yarn test -- path/to/file.test.ts   # run a single test file
yarn test -- -t "name"              # run tests by name
yarn typecheck          # tsc --noEmit
yarn compare            # tsx scripts/compare-databases.ts (compare two DB snapshots)
```

### Indexer bootstrap script

`./bootstrap.sh <action> [environment]`:

- `./bootstrap.sh dev` — generates `.env` for the local anvil (31337) chain, runs `yarn bootstrap`, `yarn codegen`, and `yarn dev`
- `./bootstrap.sh build [testnet|prod]` — install + provider aggregate (chooses `bootstrap` vs `bootstrap-testnet` from the env arg) + codegen
- `./bootstrap.sh deploy-testnet` / `deploy-prod` — Terraform deploy. Reads `RPC_URL`/`TESTNET_RPC_URL`, `AWS_ACCOUNT`, `AWS_REGION`, plus contract addresses. Use `DRY_RUN=true` to write a plan to `terraform-plans/` instead of applying.

`testnet` deploys land in the shared `dev` cluster but use a separate Terraform state file.

## Architecture

### High-level dataflow

```
Browser → React frontend ─┬─ RPC (viem/wagmi) ──→ Ethereum (mainnet/sepolia/anvil)
                          └─ REST API ─────────→ atp-indexer (Hono) ──→ Postgres / pglite
                                                       ↑ Ponder syncs events from the same chain
```

The frontend reads on-chain state directly through wagmi/viem and uses the indexer for aggregations that would be too expensive to compute in the browser (provider lists, historical staking events, ATP listings by beneficiary, etc.).

### Indexer

Ponder configuration lives in `atp-indexer/ponder.config.ts`. The indexer tracks four ATP factories (Genesis, Auction, MATP, LATP), the `StakingRegistry`, and the `Rollup`. ATP child contracts are discovered via Ponder's `factory()` pattern using the `ATPCreated` event from any of the four factories. Staker contracts are not factory-emitted — they are derived via `getStaker()`, so handlers in `src/events/staker/` filter events against known ATP positions.

- Schema: `atp-indexer/ponder.schema.ts` (drizzle-style `onchainTable` definitions, indices, and `relations`).
- Event handlers: `atp-indexer/src/events/{atp,atp-factory,rollup,staker,staking-registry}/`.
- API: Hono app in `src/api/index.ts` mounting routes from `src/api/routes/{health,providers,staking,atp}.routes.ts` under `/api/*`. CORS is open by default; rate limiting is gated on `RATE_LIMIT_ENABLED`.
- Config: `src/config/index.ts` is a lazy `Proxy` over a Zod-validated `process.env`. Always import `config` from there rather than reading `process.env` directly. Supported chains: mainnet (1), sepolia (11155111), holesky (17000), anvil (31337).
- Database: Postgres if `POSTGRES_CONNECTION_STRING` is set (with `sslmode=require|no-verify` honored), otherwise pglite. The schema name in production is pinned by `db-schemas.json`.
- Provider data: `providers/*.json` (mainnet) and `providers-testnet/*.json` (testnet) are aggregated into `src/api/data/providers.json` by `yarn bootstrap` / `yarn bootstrap-testnet`. **Adding or editing a provider requires re-running bootstrap** before `yarn dev` will pick up the change. Use `providers/_example.json` as the schema reference.

### Frontend

- Entry: `src/main.tsx` → `src/App.tsx` → `src/routes/AppRoutes.tsx`. Routing uses `react-router-dom` v7.
- Pages live under `src/pages/{ATP,Governance,NotFound,Providers,RegisterValidator,StakePortal}`. The default route (`/`) is `MyPositionPage`.
- **Governance is currently disabled** — `/governance/*` redirects to `/` in `AppRoutes.tsx`, and the UI surfaces external governance frontends via `ExternalGovernanceModal`. Don't re-enable the in-app governance route without an explicit ask.
- Contracts: `src/contracts/index.ts` builds a typed `contracts` object from Zod-validated `import.meta.env` (`VITE_*_ADDRESS`). ABIs live under `src/contracts/abis/` — these are excluded from prettier formatting.
- Hooks: `src/hooks/` is grouped per contract domain (`atp/`, `atpFactory/`, `governance/`, `staking/`, `rewards/`, etc.) plus top-level cross-cutting hooks (`useTransactionManager`, `useSafeApp`, `useStakingSteps`, …).
- Wallet: RainbowKit + wagmi configured in `src/wagmi.ts`. Safe wallet is supported via `@safe-global/*` packages and the `useSafeApp`/`SafeWarningModal` flow.
- Styling: Tailwind v4 via `@tailwindcss/vite` plus Radix primitives. UI primitives live in `src/components/ui/`. `components.json` is the shadcn config.

### Configuration model

Both frontend and indexer accept contract addresses three ways, in this priority order:

1. Environment variables (`VITE_*_ADDRESS` for the frontend, bare `*_ADDRESS` for the indexer) — preferred for CI/CD
2. `CONTRACT_ADDRESSES_FILE=/path/to/contract_addresses.json`
3. `contract_addresses.json` in the workspace root

`bootstrap.sh` in each workspace handles loading from the JSON file via `jq` and writing the appropriate env file. The frontend env vars are `VITE_`-prefixed; the indexer's are not.

## Deployment notes

- CI/CD lives in `.github/workflows/{build,deploy-staking-dashboard,deploy-indexer}.yaml`.
- Frontend is deployed to S3 + CloudFront. Both staging and prod have **red/green** deployments (see `*-green` actions in the bootstrap scripts and the hardcoded CloudFront domains in `update_env_file`).
- Indexer is deployed to ECS via Terraform. `testnet` deploys reuse the shared `dev` ECS cluster. `prod` uses its own. Each deploy bumps an ECR image tag and force-redeploys both the API and indexer ECS services.
- **Schema bumps**: When `ponder.schema.ts` changes in a way that requires a fresh DB, bump the version in `db-schemas.json`. Recent example: `beba7cc chore: bump prod db schema to v20`.

## Conventions

- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`...) — see `CONTRIBUTING.md` and recent `git log`.
- Both workspaces are TypeScript-strict; prefer `viem`/`wagmi` types over hand-rolled `Address`/`Hex` types.
- Don't reformat files under `staking-dashboard/src/contracts/abis/**` — they are intentionally excluded from prettier and changes there should be regenerated, not hand-edited.
