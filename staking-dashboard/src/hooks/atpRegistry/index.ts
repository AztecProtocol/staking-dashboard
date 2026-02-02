// Consolidated read hook - use this for parameter-less read operations
export { useAtpRegistryData, isAuctionRegistry } from "./useAtpRegistryData";

// Parameterized read hooks
export { useStakerImplementation } from "./useStakerImplementation";
export { useStakerImplementations } from "./useStakerImplementations";

// Write hook - keep separate for transactions
export { useSetExecuteAllowedAt } from "./useSetExecuteAllowedAt";
