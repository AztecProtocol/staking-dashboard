import type { Address } from "viem"

export interface SplitContractWithSource {
  address: Address
  source: "delegation" | "manual"
  providerName?: string
  /** Provider take rate in basis points (e.g., 1000 = 10%) */
  providerTakeRate?: number
}
