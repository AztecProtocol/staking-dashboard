import type { Address } from "viem"
import { formatTokenAmount } from "@/utils/atpFormatters"

interface RollupRewardRowProps {
  rollupAddress: Address
  rollupVersion: bigint | undefined
  rewards: bigint
  decimals: number
  symbol: string
  isClaimable: boolean
  isBusy: boolean
  isPending: boolean
  onClaim: (rollupAddress: Address) => void
}

export const RollupRewardRow = ({
  rollupAddress,
  rollupVersion,
  rewards,
  decimals,
  symbol,
  isClaimable,
  isBusy,
  isPending,
  onClaim,
}: RollupRewardRowProps) => (
  <div className="bg-chartreuse/10 border border-chartreuse/30 p-4">
    <div className="flex items-center justify-between gap-3 mb-2">
      {rollupVersion !== undefined ? (
        <span
          className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5"
          title={`Rollup contract: ${rollupAddress}`}
        >
          Rollup v{rollupVersion.toString()}
        </span>
      ) : (
        <span className="font-oracle-standard text-[10px] uppercase tracking-wide text-parchment/50">
          Configured rollup
        </span>
      )}
      <div className="font-mono text-lg font-bold text-chartreuse">
        {formatTokenAmount(rewards, decimals, symbol)}
      </div>
    </div>
    <button
      onClick={() => onClaim(rollupAddress)}
      disabled={isBusy || !isClaimable}
      className="w-full py-2 bg-chartreuse text-ink font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isBusy ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin" />
          {isPending ? 'Confirming' : 'Claiming'}
        </div>
      ) : !isClaimable ? (
        'Locked on this rollup'
      ) : (
        'Claim from this rollup'
      )}
    </button>
  </div>
)
