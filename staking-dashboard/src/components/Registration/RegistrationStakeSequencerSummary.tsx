import { formatTokenAmount } from "@/utils/atpFormatters"

interface RegistrationStakeSequencerSummaryProps {
  numberOfAttesters: number
  activationThreshold: bigint | undefined
  totalStakeAmount: bigint
  decimals: number
  symbol: string
  isLoading: boolean
}

/**
 * Displays summary card showing sequencer count and stake amounts
 */
export const RegistrationStakeSequencerSummary = ({
  numberOfAttesters,
  activationThreshold,
  totalStakeAmount,
  decimals,
  symbol,
  isLoading
}: RegistrationStakeSequencerSummaryProps) => {
  return (
    <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
      {isLoading ? (
        <div className="text-center text-parchment/60 py-4">Loading stake details...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-1">Sequencers</div>
              <div className="text-xl font-mono font-bold text-chartreuse">
                {numberOfAttesters}
              </div>
            </div>
            <div>
              <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-1">Per Sequencer</div>
              <div className="text-xl font-mono font-bold text-aqua">
                {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-parchment/20">
            <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-1">Total To Be Staked</div>
            <div className="text-lg font-mono font-bold text-parchment">
              {formatTokenAmount(totalStakeAmount, decimals, symbol)}
            </div>
            <div className="text-xs text-parchment/50 mt-1">
              {numberOfAttesters} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
