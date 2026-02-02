import { useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/Icon"
import { TooltipIcon } from "@/components/Tooltip"

interface DecentralizationDisclaimerProps {
  operatorName: string
  operatorRank: number
  onProceed: () => void
  onCancel: () => void
}

/**
 * Disclaimer modal for top 10 operators to promote decentralization
 * Warns users about concentration risks when selecting popular providers
 */
export const DecentralizationDisclaimer = ({
  operatorName,
  operatorRank,
  onProceed,
  onCancel
}: DecentralizationDisclaimerProps) => {
  const [understood, setUnderstood] = useState(false)

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ink border border-ink/20 max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Icon name="warning" size="lg" className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-md-thermochrome text-xl text-parchment">
                Decentralization Notice
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-sm text-parchment/70">Help keep Aztec decentralized</span>
                <TooltipIcon
                  content="Network security and decentralization depend on stake being distributed across many providers rather than concentrated in a few large ones."
                  size="sm"
                  maxWidth="max-w-sm"
                />
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-parchment/60 hover:text-parchment transition-colors p-2"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 mb-4">
            <p className="font-oracle-standard text-sm text-parchment/90 leading-relaxed">
              <strong>{operatorName}</strong> is ranked <strong>#{operatorRank}</strong> and already has high stake concentration.
            </p>
          </div>

          <div className="text-sm text-parchment/80">
            <p className="mb-3">
              Consider choosing a smaller provider to help keep the network decentralized and secure.
            </p>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 border-2 transition-all ${
                understood
                  ? 'bg-chartreuse border-chartreuse'
                  : 'border-parchment/40 bg-transparent'
              }`}>
                {understood && (
                  <Icon name="check" size="sm" className="text-ink" />
                )}
              </div>
            </div>
            <span className="font-oracle-standard text-sm text-parchment/90 leading-relaxed">
              I understand the risks and want to proceed anyway.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-parchment/10 border border-parchment/30 text-parchment py-3 px-4 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/20 transition-all"
          >
            Choose Different Provider
          </button>
          <button
            onClick={onProceed}
            disabled={!understood}
            className={`flex-1 py-3 px-4 font-oracle-standard font-bold text-xs uppercase tracking-wider transition-all ${
              understood
                ? 'bg-chartreuse text-ink hover:bg-chartreuse/90'
                : 'bg-parchment/20 text-parchment/50 cursor-not-allowed'
            }`}
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}