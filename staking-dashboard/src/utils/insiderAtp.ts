import { isAddressEqual, type Address } from "viem"

// ATP registries covered by AZIP-32. Their ATPs have no staking requirement before
// withdrawal, and their locked tokens earn no sequencer rewards. They may still run their
// own node, but delegating them to a provider is disabled.
export const INSIDER_ATP_REGISTRIES: Address[] = [
  "0xD938bE4A2cB41105Bc2FbE707dca124A2e5d0c80",
  "0x667d2641cb96734f386adA6A9afCF07B1815fB8b",
]

export const isInsiderAtp = (registry: Address | undefined) =>
  !!registry && INSIDER_ATP_REGISTRIES.some((insider) => isAddressEqual(insider, registry))

export const INSIDER_DELEGATION_MESSAGE =
  "Locked tokens don't earn staking rewards. To delegate, claim your unlocked tokens from this Token Vault first, then stake them from your wallet."
