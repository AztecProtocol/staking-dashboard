import type { MATPData } from "../hooks/atp/matp";
import type { LATPData } from "../hooks/atp/latp";
import type { NCATPData } from "../hooks/atp/ncatp";
import type { Address } from "viem";

export const mockATPs: (MATPData | LATPData | NCATPData)[] = [
  // MATP with cliff and end on same date
  {
    atpAddress: "0x1234567890123456789012345678901234567890" as Address,
    allocation: 600000000000000000000n,
    beneficiary: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    operator: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    staker: "0x1111111111111111111111111111111111111111" as Address,
    claimable: 300000000000000000000n,
    claimed: 0n,
    globalLock: {
      startTime: 1704067200n, // Jan 1, 2024
      cliff: 1767225600n, // Jan 1, 2026
      endTime: 1767225600n, // Jan 1, 2026 (same as cliff)
      allocation: 600000000000000000000n,
    },
    milestoneId: 0n,
    registry: "0x2222222222222222222222222222222222222222" as Address,
    type: 1,
    typeString: 'MATP' as const,
    token: "0x5555555555555555555555555555555555555555" as Address,
    executeAllowedAt: 1704067200n,
    isRevokable: false,
    revokeBeneficiary: "0x0000000000000000000000000000000000000000" as Address,
  },
  // LATP with normal cliff and end dates (not NCATP)
  {
    atpAddress: "0x9876543210987654321098765432109876543210" as Address,
    allocation: 900000000000000000000n,
    beneficiary: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    operator: "0x0000000000000000000000000000000000000000" as Address,
    staker: "0x3333333333333333333333333333333333333333" as Address,
    claimable: 900000000000000000000n,
    claimed: 0n,
    globalLock: {
      startTime: 1704067200n, // Jan 1, 2024
      cliff: 1735689600n, // Jan 1, 2025
      endTime: 1893456000n, // Jan 1, 2030
      allocation: 900000000000000000000n,
    },
    registry: "0x4444444444444444444444444444444444444444" as Address,
    type: 2,
    typeString: 'LATP' as const,
    token: "0x6666666666666666666666666666666666666666" as Address,
    executeAllowedAt: 1704067200n,
    isRevokable: true,
    revokeBeneficiary: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    accumulationStartTime: 1704067200n,
    accumulationCliffDuration: 31622400n,
    accumulationLockDuration: 157766400n,
  },
  // NCATP with end date after Nov 13, 2026 (should be overridden to Nov 13, 2026)
  {
    atpAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
    allocation: 1200000000000000000000n,
    beneficiary: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    operator: "0x742d35Cc6634C0532925a3b8D35d7C2F5C45A6f6" as Address,
    staker: "0x7777777777777777777777777777777777777777" as Address,
    claimable: 1200000000000000000000n,
    claimed: 0n,
    globalLock: {
      startTime: 1731456000n, // Nov 13, 2024
      cliff: 1762992000n, // Jul 13, 2025
      endTime: 1920240000n, // Nov 13, 2030 (will be overridden to Nov 13, 2026)
      allocation: 1200000000000000000000n,
    },
    registry: "0x8888888888888888888888888888888888888888" as Address,
    type: 3,
    typeString: 'NCATP' as const,
    token: "0x9999999999999999999999999999999999999999" as Address,
    executeAllowedAt: 1731456000n,
    isRevokable: false,
    revokeBeneficiary: "0x0000000000000000000000000000000000000000" as Address,
    accumulationStartTime: 1731456000n,
    accumulationCliffDuration: 31536000n,
    accumulationLockDuration: 188784000n,
    CREATED_AT_TIMESTAMP: 1731456000n,
  },
];
