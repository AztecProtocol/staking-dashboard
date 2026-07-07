# atp-indexer single-instance stack

Collapses the staking-dashboard **atp-indexer**'s per-env **ECS + Aurora + ALB** onto one
EC2 box running the indexer (this repo's own image) against a **local Postgres**, fronted by
**Caddy** (Caddy-direct TLS for testnet, or **CloudFront-front** for prod). This mirrors the
ignition-monorepo single-instance pattern — the two repos are decoupled and their
atp-indexers have **diverged** (this one additionally indexes `ATP_FACTORY_MATP`/`LATP` and
has the zombie/withdrawing provider features), so each repo runs **its own** indexer code.

The **frontend is unchanged** — it stays on S3+CloudFront (already ~free). This stack only
moves the expensive indexer.

## What it creates (own Terraform state)
- EC2 (default-VPC public subnet) + EIP + a persistent gp3 `/data` EBS volume (xfs).
- IAM (SSM core + ECR pull), a public 80/443 security group.
- `user_data` that mounts `/data`, writes `docker-compose.yml` + `Caddyfile`, and (optionally)
  `docker compose up`. Services: `atp-indexer` (port 42068), `local-postgres` (16), `caddy`.
- Optionally (prod) a CloudFront distribution fronting the indexer hostname with ACM
  (us-east-1), an http-only origin via a stable `atp-si-origin.<env>` A-record → EIP, and the
  CloudFront secret header that Caddy enforces.

## Endpoint

Hostname convention: **`api.<env>.stake.aztec.network`**, and **`api.stake.aztec.network`**
for prod — one stable, branded API endpoint. The dashboard's `VITE_API_HOST` points at it
instead of a raw `*.cloudfront.net` URL, so swapping the infra behind it (fleet → box, or
anything later) never requires a frontend change again.

## Pre-flight (new box standups)

- **EIP headroom**: the stack allocates one Elastic IP; `AddressLimitExceeded` has bitten two
  standups. Check `aws ec2 describe-addresses` against the account quota first (an increase
  to 30 was requested).
- **Runtime env**: put the 21-var env in SSM as a SecureString at
  `/staking-dashboard-atp/<env>/atp-indexer.env` (same values the deploy workflow holds as
  GitHub environment vars). The box fetches it at boot via `fetch-env.sh`; it never starts on
  an unpopulated env file.
- **Image**: build with `yarn bootstrap` run first — the Dockerfile refuses to build without
  the generated `providers.json`.

## Deploys

Use the **Deploy ATP Indexer** workflow (single-instance is the default): it builds + pushes
the image and invokes `scripts/box-deploy.sh` on the box via SSM. Metadata-only changes
restart in place (seconds); pass `new_schema` for indexing-code changes and the script runs
the A/B rebuild-from-cache + parity check + flip automatically.

## Deploy
```sh
cd atp-indexer/single-instance
terraform init -backend-config="key=<env>/staking-dashboard/atp-indexer-single-instance/terraform.tfstate"
terraform apply \
  -var env=testnet \
  -var si_atp_indexer_image=<account>.dkr.ecr.eu-west-2.amazonaws.com/staking-dashboard-testnet-atp-indexer:<tag> \
  -var si_atp_database_schema=atp_indexer \
  -var si_atp_indexer_domain=api.testnet.stake.aztec.network
```
Then SSM onto the box, populate `/opt/staking-dashboard-atp/env/atp-indexer.env` with the
**same values the ECS task-def used** — copy the full set from `atp-indexer/terraform/app.tf`
(`indexer_env_vars`, ~25 vars). The required ones are RPC_URL, CHAIN_ID, START_BLOCK, the
`ATP_FACTORY_*` addresses, `*_FACTORY_START_BLOCK`, and the registry vars; the rest are tuning
(`BLOCK_BATCH_SIZE`, `POLLING_INTERVAL`, `MAX_RETRIES`, `PARALLEL_BATCHES`, `CLEANUP_*`,
`TRUST_PROXY`, `PONDER_TELEMETRY_DISABLED`) and fall back to image defaults if omitted. Then
`docker compose up -d` (or set `-var si_start_services_on_boot=true` once the env file exists).

### testnet (Caddy-direct)
`-var si_create_dns_records=true` → Caddy gets Let's Encrypt certs for the hostname (point DNS
at the EIP first).

### prod (CloudFront-front)
`-var si_front_with_cloudfront=true -var si_create_dns_records=false`
The **CloudFront secret header** and **CLOUDFRONT-scoped WAF** are read automatically from the
shared `ignition-infrastructure` state / SSM — the same ones the existing atp-indexer
CloudFront uses — so you normally **don't** pass them. Set `-var env_parent=<parent>` if the
shared state isn't under the same env name. Overrides if ever needed:
`-var cloudfront_secret_header_value=<secret>`, `-var si_cf_web_acl_arn=<arn>`.
CloudFront serves viewer TLS; the box serves http-only to CloudFront only.

## Deploys & resyncs (A/B on the box)

The fleet used a whole second environment (prod-g) so a resync could run against a non-live
backend. The box gets the same property from Ponder's schema-per-deploy model, one tier down:

1. **Code deploy / resync (common case)** — run the new build as a second compose service
   (`atp-indexer-next`, its own `DATABASE_SCHEMA`, internal port) against the same local
   Postgres. It rebuilds its schema from the shared `ponder_sync` RPC cache (~2 min, zero
   RPC refetch; a true from-chain resync also works and only that container pays for it)
   while the live container keeps serving. Verify parity (row counts, spot queries), then
   flip Caddy's `reverse_proxy` target (or swap the service image) — instant, no CloudFront
   change. The old schema stays in Postgres as the instant rollback.
2. **Box-level A/B (risky changes: OS, volume, Postgres major)** — the stack is additive, so
   stand up a second box and repoint the `si-origin` A-record (60s TTL) at the new EIP.
   CloudFront and the public hostname never change.

Metadata-only image updates (providers.json) don't change the Ponder build fingerprint:
pull + restart adopts the existing schema and is back at head in seconds.

## Cutover (decommission the old fleet)
1. Stand up this box; seed/let it reach head (the indexer is RPC-bound — see ignition's
   ROAD-TO-PROD notes; restore a `pg_dump` if you have one to skip the reindex).
2. Repoint the **frontend's** indexer URL to this box's endpoint:
   - **2a. Terraform state.** The frontend reads the URL from the atp-indexer's remote state
     (`staking-dashboard/terraform/data.tf` →
     `data.terraform_remote_state.atp-indexer.outputs.cf_domain_name`). Change that data
     source's `key` from the old atp-indexer state (`.../backends/atp-indexer/terraform.tfstate`)
     to this stack's state (`<env>/staking-dashboard/atp-indexer-single-instance/terraform.tfstate`).
     This stack exposes a **`cf_domain_name`** output **in both modes** (same name as the old
     stack), so no frontend code change beyond the state `key`:
       - prod (CloudFront-front): `cf_domain_name` = the box's CloudFront domain.
       - testnet (Caddy-direct): `cf_domain_name` = the indexer hostname (`si_atp_indexer_domain`,
         which resolves to the EIP with Caddy serving Let's Encrypt TLS).
   - **2b. Rebuild + redeploy the frontend.** The indexer URL is baked into the static build at
     build time (`staking-dashboard/bootstrap.sh` reads `ATP_INDEXER_URL` from the terraform
     output). So after 2a you must **rebuild and redeploy** the frontend to S3+CloudFront for it
     to point at the new indexer — a terraform change alone is not enough. Do this only **after**
     the box has reached parity, so the live frontend never points at an empty indexer.
3. After parity, tear down the old `atp-indexer/terraform` ECS service / Aurora / ALB
   (e.g. scale the service to 0, then `terraform destroy` those resources). **Snapshot the
   Aurora data first.** Keep the existing CloudFront if you prefer to repoint its origin
   instead of using this stack's CloudFront — either works; pick one to own the hostname.

## Notes
- Intentional duplication of the ignition single-instance templates (the repos are decoupled).
- `terraform validate` passes. Not yet applied; prod is a separate account — review + `plan`
  there before applying.
