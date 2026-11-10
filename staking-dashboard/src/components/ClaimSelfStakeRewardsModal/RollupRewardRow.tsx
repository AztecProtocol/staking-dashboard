import type { Address } from "viem"
import { Icon } from "@/components/Icon"
import { formatTokenAmount } from "@/utils/atpFormatters"

interface RollupRewardRowProps {
  rollupAddress: Address
  rollupVersion: string | undefined
  rewards: bigint
  decimals: number
  symbol: string
  isClaimable: boolean
  isInBatch: boolean
  onAddToBatch: () => void
  onOpenCart: () => void
}

export const RollupRewardRow = ({
  rollupAddress,
  rollupVersion,
  rewards,
  decimals,
  symbol,
  isClaimable,
  isInBatch,
  onAddToBatch,
  onOpenCart,
}: RollupRewardRowProps) => (
  <div className="bg-parchment/5 border border-parchment/20 p-4 rounded-inset">
    <div className="flex items-center justify-between gap-3 mb-2">
      {rollupVersion !== undefined ? (
        <span
          className="font-oracle-standard text-[10px] uppercase tracking-wide bg-aqua/15 border border-aqua/30 text-aqua px-2 py-0.5 rounded-inset"
          title={`Rollup contract: ${rollupAddress}`}
        >
          Rollup v{rollupVersion}
        </span>
      ) : (
        <span className="font-oracle-standard text-[10px] uppercase tracking-wide text-parchment/50">
          Configured rollup
        </span>
      )}
      <div className="font-mono text-lg font-bold text-accent">
        {formatTokenAmount(rewards, decimals, symbol)}
      </div>
    </div>
    {!isClaimable ? (
      <button
        disabled
        className="w-full py-2 btn-lime text-xs opacity-50 cursor-not-allowed"
      >
        Locked on this rollup
      </button>
    ) : isInBatch ? (
      <button
        onClick={onOpenCart}
        className="w-full py-2 bg-parchment/10 border border-parchment/20 text-accent font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/15 transition-all rounded-btn"
      >
        <span className="flex items-center justify-center gap-2">
          <Icon name="shoppingCart" size="sm" />
          In batch — review &amp; execute
        </span>
      </button>
    ) : (
      <button
        onClick={onAddToBatch}
        className="w-full py-2 btn-lime text-xs"
      >
        Add to batch
      </button>
    )}
  </div>
)
