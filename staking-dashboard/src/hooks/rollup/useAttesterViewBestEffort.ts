import { useMemo } from "react"
import type { Address } from "viem"
import { useReadContracts } from "wagmi"
import { contracts, getRollupVersions } from "@/contracts"
import { attesterRollupCandidates, selectAttesterRollup } from "./attesterRollupSelection"

/**
 * Optional indexer-supplied hint about which rollup currently holds the
 * live record. The indexer captures `moveWithRollup` from the originating
 * tx's calldata and bulk-updates `effectiveRollup` whenever the canonical
 * rollup rotates. It's used to break ties when the chain shows records on
 * more than one rollup; it never overrides the chain (see
 * `selectAttesterRollup`).
 */
export interface AttesterViewHint {
  effectiveRollup: Address
  moveWithRollup: boolean | null
}

/**
 * Looks up an attester via `getAttesterView` on every rollup version the
 * Registry has made canonical (plus the deposit-time rollup and indexer hint,
 * if not already among them), in one multicall, and returns whichever view
 * recognises the attester (non-NONE status). Covers:
 *
 *   - Auto-migrating stakes (`moveWithRollup = true`): the record follows
 *     canonical, so the deposit-time rollup returns NONE and canonical has it.
 *   - Pinned stakes (`moveWithRollup = false`): the record stays on the
 *     deposit-time rollup.
 *   - Exits on an intermediate rollup: an exit (voluntary, or a ZOMBIE from
 *     slashing) stays locked on the rollup it started on, which may be
 *     neither the deposit-time rollup nor canonical, and the indexer hint may
 *     have moved past it. Probing every version finds it anyway.
 *   - Genuinely unregistered: every read is NONE; we return a well-defined
 *     NONE result (see `selectAttesterRollup` for which rollup it's from).
 *
 * Returns the **effective rollup** the live record was found on, alongside
 * the view data. Callers that need to send writes (unstake, etc.) should
 * use `effectiveRollup` as the target — NOT the indexer-supplied
 * `rollupAddress`, which records where the deposit happened and may
 * disagree with where the stake currently lives.
 *
 * Used by `useSequencerStatus` and `useStakeHealth` to avoid duplicating the
 * preference logic.
 */
export function useAttesterViewBestEffort(
  attesterAddress: Address | undefined,
  rollupAddress: Address | undefined,
  hint?: AttesterViewHint | null,
) {
  const canonicalRollup = contracts.rollup.address
  const hintRollup = hint?.effectiveRollup

  const candidates = useMemo(
    () =>
      attesterRollupCandidates(
        canonicalRollup,
        getRollupVersions().map((v) => v.address),
        rollupAddress,
        hintRollup,
      ),
    [canonicalRollup, rollupAddress, hintRollup],
  )

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: candidates.map((address) => ({
      address,
      abi: contracts.rollup.abi,
      functionName: "getAttesterView" as const,
      args: attesterAddress ? ([attesterAddress] as const) : undefined,
    })),
    query: {
      enabled: !!attesterAddress,
    },
  })

  const views = candidates.map((_, i) => {
    const entry = data?.[i]
    return entry?.status === "success" ? entry.result : undefined
  })
  const selected = selectAttesterRollup(
    candidates,
    views.map((v) => v?.status),
    hintRollup,
  )
  const attesterView = views[selected]

  // A failed read could be the one rollup holding the record, so surface it
  // rather than silently presenting a NONE result.
  const readError =
    error ?? data?.find((entry) => entry.status === "failure")?.error ?? null

  return {
    attesterView,
    status: attesterView?.status,
    effectiveBalance: attesterView?.effectiveBalance,
    exit: attesterView?.exit,
    config: attesterView?.config,
    /** The rollup the live record was found on. Use this as the target for
     *  any unstake / withdraw write — see hook docstring. */
    effectiveRollup: candidates[selected],
    isLoading,
    error: readError,
    refetch: () => {
      refetch()
    },
  }
}
