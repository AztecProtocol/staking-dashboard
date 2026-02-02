import type { Address } from "viem";

// Get staker implementation addresses from environment variables
const ATP_NON_WITHDRAWABLE_STAKER_ADDRESS = import.meta.env
  .VITE_ATP_NON_WITHDRAWABLE_STAKER_ADDRESS as Address;
const ATP_WITHDRAWABLE_STAKER_ADDRESS = import.meta.env
  .VITE_ATP_WITHDRAWABLE_STAKER_ADDRESS as Address;
const ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS = import.meta.env
  .VITE_ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS as Address;

export const getImplementationDescription = (
  implementationAddress?: Address,
  version?: bigint | number,
): string => {
  // Check version first - v0 is always default/disabled
  if (!implementationAddress) {
    return "Unknown implementation";
  }

  const address = implementationAddress.toLowerCase();

  // TODO : update the descriptions
  if (
    ATP_NON_WITHDRAWABLE_STAKER_ADDRESS &&
    address === ATP_NON_WITHDRAWABLE_STAKER_ADDRESS.toLowerCase()
  ) {
    return "Can stake, cannot withdraw";
  }

  if (
    ATP_WITHDRAWABLE_STAKER_ADDRESS &&
    address === ATP_WITHDRAWABLE_STAKER_ADDRESS.toLowerCase()
  ) {
    return "Can both stake and withdraw";
  }

  if (
    ATP_WITHDRAWABLE_STAKER_ADDRESS &&
    address === ATP_WITHDRAWABLE_STAKER_ADDRESS.toLowerCase()
  ) {
    return "Can both stake and withdraw";
  }

  if (
    ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS &&
    address === ATP_WITHDRAWABLE_AND_CLAIMABLE_STAKER_ADDRESS.toLowerCase()
  ) {
    return "Can stake, withdraw & claim staker balance";
  }

  if (address && Number(version) === 0) {
    return "Default implementation (stake disabled)"
  }


  return implementationAddress;
};

export const getVersionByImplementation = (
  implementation?: Address,
  versionToImplementation?: Record<number, Address | undefined>,
): bigint | null => {
  if (!implementation) return 0n;
  if (!versionToImplementation) return null;

  const match = Object.entries(versionToImplementation).find(
    ([, addr]) => addr?.toLowerCase() === implementation.toLowerCase(),
  );
  return match ? BigInt(match[0]) : null;
};

export const implementationSupportsStaking = (
  implementation: Address,
  implementations: Record<number, Address | undefined>,
): boolean => {
  // Iterate over all entries in the record
  for (const [keyStr, value] of Object.entries(implementations)) {
    if (value === implementation) {
      const key = Number(keyStr);
      return key > 0;
    }
  }
  return false;
};

// Helper function to get implementation for a specific version
export const getImplementationForVersion = (
  version: bigint | number,
  versionToImplementation?: Record<number, Address | undefined>,
): Address | undefined => {
  if (!versionToImplementation) return undefined;
  return versionToImplementation[Number(version)];
};
