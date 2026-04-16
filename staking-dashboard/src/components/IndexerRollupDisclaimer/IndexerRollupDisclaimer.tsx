import { Icon } from "@/components/Icon"
import { useRollupRegistry } from "@/hooks/rollup/useRollupRegistry"

/**
 * Small inline disclaimer shown on pages that surface historical aggregates from the indexer
 * (providers list, provider details, StakePortal summaries). It only renders when the
 * dashboard detects more than one rollup in the governance Registry so operators aren't
 * confused by a missing disclaimer on single-rollup deployments.
 */
export const IndexerRollupDisclaimer = () => {
  const { rollups, isLoading } = useRollupRegistry()

  // Only show when there's more than one known rollup; single-rollup deployments have
  // complete data so the disclaimer would be misleading.
  if (isLoading || rollups.length <= 1) return null

  return (
    <div className="flex items-center gap-2 text-xs text-parchment/50 mt-4 py-2 border-t border-parchment/10">
      <Icon name="info" size="sm" className="text-parchment/40 flex-shrink-0" />
      <span>
        Historical statistics reflect the configured rollup only and may not include data from
        older or canonical rollups.
      </span>
    </div>
  )
}
