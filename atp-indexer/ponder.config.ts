import { createConfig, DatabaseConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { config } from "./src/config";
import {
  ATP_ABI,
  STAKING_REGISTRY_ABI,
  ROLLUP_ABI,
  STAKER_ABI,
  REGISTRY_ABI,
} from "./src/abis";

// ATPCreated event signature for factory pattern
const ATPCreatedEvent = parseAbiItem(
  "event ATPCreated(address indexed beneficiary, address indexed atp, uint256 allocation)"
);

// Aztec Registry emits this on every rollup upgrade. Used as a factory source
// so every canonical rollup, historical and future, is indexed without a
// config change.
const CanonicalRollupUpdatedEvent = parseAbiItem(
  "event CanonicalRollupUpdated(address indexed instance, uint256 indexed version)"
);

// Per-factory start blocks for efficient indexing
const FACTORY_START_BLOCKS = {
  genesis: config.START_BLOCK || 0,
  auction: config.START_BLOCK || 0,
  matp: config.MATP_FACTORY_START_BLOCK || config.START_BLOCK || 0,
  latp: config.LATP_FACTORY_START_BLOCK || config.START_BLOCK || 0,
};

// One block before the Registry's deployment, which is harmless (the Registry
// has no events earlier) but changes the Rollup factory's id. Ponder <0.17.2
// never saved rollups it discovered during live indexing to
// ponder_sync.factory_addresses when the factory fed several handlers, while
// still marking the blocks as synced. On mainnet that dropped every Rollup
// event from v5 and v6. A new factory id makes Ponder refetch the Registry and
// Rollup logs instead of trusting that cache. Do not "tidy" this back to
// REGISTRY_START_BLOCK: the old id would pick the incomplete cache up again.
const ROLLUP_FACTORY_START_BLOCK = Math.max(0, (config.REGISTRY_START_BLOCK || 0) - 1);

// Same fix for the ATP factory, which feeds two handlers (Claimed and
// StakerOperatorUpdated). On mainnet the indexer had no Claimed rows for ATPs
// created since the single-instance box went live. One block before the
// earliest ATP factory gives the factory a new id, so Ponder refetches the ATP
// contracts' logs. Do not "tidy" this back to the earliest factory block.
const ATP_FACTORY_START_BLOCK = Math.max(0, Math.min(...Object.values(FACTORY_START_BLOCKS)) - 1);

let databaseConfig: DatabaseConfig | undefined;

if (config.POSTGRES_CONNECTION_STRING) {
  const pgSSLMode = new URL(config.POSTGRES_CONNECTION_STRING as string).searchParams.get('sslmode');
  let pgSSLConfig: { rejectUnauthorized: boolean } | undefined;
  if (pgSSLMode === 'require') {
    pgSSLConfig = { rejectUnauthorized: true };
  } else if (pgSSLMode === 'no-verify') {
    pgSSLConfig = { rejectUnauthorized: false };
  }

  databaseConfig = {
    kind: 'postgres',
    connectionString: config.POSTGRES_CONNECTION_STRING,
    poolConfig: {
      ssl: pgSSLConfig,
    },
  };
} else {
  databaseConfig = {
    kind: 'pglite',
  };
}

export default createConfig({
  database: databaseConfig,
  chains: {
    [config.networkName]: {
      id: config.CHAIN_ID,
      rpc: config.RPC_URL,
    },
  },
  contracts: {
    /**
     * ATP Factory - Genesis Sale contract
     * Emits ATPCreated events when new ATP positions are created
     */
    ATPFactory: {
      chain: config.networkName,
      abi: ATP_ABI,
      address: config.ATP_FACTORY_ADDRESS as `0x${string}`,
      startBlock: FACTORY_START_BLOCKS.genesis,
    },

    /**
     * ATP Factory - Auction contract
     * Alternative factory for auction-based ATP creation
     */
    ATPFactoryAuction: {
      chain: config.networkName,
      abi: ATP_ABI,
      address: config.ATP_FACTORY_AUCTION_ADDRESS as `0x${string}`,
      startBlock: FACTORY_START_BLOCKS.auction,
    },

    /**
     * ATP Factory - MATP contract (milestone-based ATPs).
     *
     * Falls back to the zero address when `ATP_FACTORY_MATP_ADDRESS`
     * isn't set (testnet doesn't deploy this factory). Ponder scans
     * the zero address for events, finds none, the handler never fires
     * — keeping the contract statically present in the config so the
     * generated `EventNames` union includes it, which is required for
     * `ponder.on("ATPFactoryMATP:…", …)` in `events/atp-factory/` to
     * typecheck on every env regardless of which factories are deployed.
     */
    ATPFactoryMATP: {
      chain: config.networkName,
      abi: ATP_ABI,
      address: (config.ATP_FACTORY_MATP_ADDRESS
        ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
      startBlock: FACTORY_START_BLOCKS.matp,
    },

    /**
     * ATP Factory - LATP contract (linear-vesting ATPs).
     * Same zero-address fallback pattern as MATP above.
     */
    ATPFactoryLATP: {
      chain: config.networkName,
      abi: ATP_ABI,
      address: (config.ATP_FACTORY_LATP_ADDRESS
        ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
      startBlock: FACTORY_START_BLOCKS.latp,
    },

    /**
     * Staking Registry
     * Central contract managing providers and staking operations
     */
    StakingRegistry: {
      chain: config.networkName,
      abi: STAKING_REGISTRY_ABI,
      address: config.STAKING_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: config.START_BLOCK,
    },

    /**
     * Aztec Registry
     * Tracked as a regular contract so we can index CanonicalRollupUpdated
     * events into a rollup_version table, served from /api/rollups so the
     * frontend doesn't need its own Registry RPC calls. The same event is
     * also used as a factory source for the Rollup contract below.
     */
    Registry: {
      chain: config.networkName,
      abi: REGISTRY_ABI,
      address: config.REGISTRY_ADDRESS as `0x${string}`,
      startBlock: config.REGISTRY_START_BLOCK,
    },

    /**
     * Rollup Contract (dynamic, sourced from the Aztec Registry)
     * Handles validator deposits and tracks validator queue.
     *
     * Uses Ponder's factory pattern on the Registry's `CanonicalRollupUpdated`
     * event so every rollup address the Registry has ever announced (historical
     * versions and any future upgrade) is indexed automatically. Handlers in
     * src/events/rollup/ fire for events from any of these addresses, so
     * rewards/withdrawals/slashing on older rollups keep being tracked even
     * after an upgrade.
     */
    Rollup: {
      chain: config.networkName,
      abi: ROLLUP_ABI,
      address: factory({
        address: config.REGISTRY_ADDRESS as `0x${string}`,
        event: CanonicalRollupUpdatedEvent,
        parameter: "instance",
      }),
      startBlock: ROLLUP_FACTORY_START_BLOCK,
    },

    /**
     * Dynamic ATP Contracts
     * Created by factory events, tracks operator updates.
     * Unset MATP / LATP factory env vars resolve to the zero address;
     * `eth_getLogs(zeroAddress)` returns empty, so the factory pattern
     * just sees no `ATPCreated` events from those slots on envs where
     * those factories aren't deployed.
     */
    ATP: {
      chain: config.networkName,
      abi: ATP_ABI,
      address: factory({
        address: [
          config.ATP_FACTORY_ADDRESS as `0x${string}`,
          config.ATP_FACTORY_AUCTION_ADDRESS as `0x${string}`,
          (config.ATP_FACTORY_MATP_ADDRESS
            ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
          (config.ATP_FACTORY_LATP_ADDRESS
            ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        ],
        event: ATPCreatedEvent,
        parameter: "atp",
      }),
      // Just before the earliest factory, to capture all ATP contracts; see ATP_FACTORY_START_BLOCK
      startBlock: ATP_FACTORY_START_BLOCK,
    },

    /**
     * Dynamic Staker Contracts
     * Linked to ATP positions via getStaker() call
     * Note: Cannot use factory pattern since Staker addresses are derived, not emitted.
     * Events are filtered in handlers by checking against known ATP positions.
     */
    Staker: {
      chain: config.networkName,
      abi: STAKER_ABI,
      startBlock: config.START_BLOCK,
    },
  },
});
