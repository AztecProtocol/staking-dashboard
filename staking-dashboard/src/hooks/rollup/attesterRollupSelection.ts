import type { Address } from "viem"
import { SequencerStatus } from "./sequencerStatus"

const sameAddress = (a: Address, b: Address) => a.toLowerCase() === b.toLowerCase()

/**
 * Every rollup an attester's live record could be on, deduplicated, in the
 * order the selection below prefers them when several hold a record:
 * canonical first, then the Registry's historical versions newest-first, then
 * the deposit-time rollup and indexer hint in case either is missing from the
 * version list (e.g. `/api/rollups` lagging behind a cutover).
 *
 * Probing every known version (rather than just canonical + deposit-time +
 * hint) is what makes exits on an intermediate rollup findable. Example: a
 * stake deposited on rollup A auto-migrates to B, is slashed into ZOMBIE on
 * B, then canonical moves to C. Slashing emits no `WithdrawInitiated`, so the
 * indexer moves its hint to C, while the exit stays locked on B. Neither A, C
 * nor the hint would find it.
 */
export function attesterRollupCandidates(
  canonicalRollup: Address,
  versionAddressesOldestFirst: readonly Address[],
  depositRollup: Address | undefined,
  hintRollup: Address | undefined,
): Address[] {
  const ordered = [
    canonicalRollup,
    ...[...versionAddressesOldestFirst].reverse(),
    ...(depositRollup ? [depositRollup] : []),
    ...(hintRollup ? [hintRollup] : []),
  ]
  const out: Address[] = []
  for (const address of ordered) {
    if (!out.some((seen) => sameAddress(seen, address))) out.push(address)
  }
  return out
}

/**
 * Picks which candidate's `getAttesterView` result describes the stake.
 * `statuses[i]` is the status read from `candidates[i]` (undefined while
 * loading or on a failed read).
 *
 * Preference, highest first:
 *   1. The indexer hint, if the chain shows a record there. When an attester
 *      has records on two rollups (a pending exit on an old rollup and a
 *      re-deposit on canonical), the hint points at the one the indexer
 *      tracks, so this keeps the exit reachable until it's finalized.
 *   2. Any other rollup with a record, in candidate order (canonical, then
 *      newest historical version first).
 *   3. No record anywhere: the hint if one was given, so the stake keeps a
 *      stable "where it last lived" target, otherwise canonical. Callers gate
 *      their actions on the NONE status either way.
 *
 * The chain is authoritative: the hint only wins when its own read found a
 * record.
 */
export function selectAttesterRollup(
  candidates: readonly Address[],
  statuses: readonly (number | undefined)[],
  hintRollup: Address | undefined,
): number {
  const hasRecord = (i: number) => statuses[i] !== undefined && statuses[i] !== SequencerStatus.NONE
  const hintIndex = hintRollup ? candidates.findIndex((c) => sameAddress(c, hintRollup)) : -1

  if (hintIndex !== -1 && hasRecord(hintIndex)) return hintIndex
  const live = candidates.findIndex((_, i) => hasRecord(i))
  if (live !== -1) return live
  return hintIndex !== -1 ? hintIndex : 0
}
