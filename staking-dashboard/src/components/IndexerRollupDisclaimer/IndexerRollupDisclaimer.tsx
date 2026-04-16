import { Icon } from "@/components/Icon"
import { useRollupRegistry } from "@/hooks/rollup/useRollupRegistry"

/** Disclaimer shown on provider pages when multiple rollups exist. */
export const IndexerRollupDisclaimer = () => {
  const { rollups, isLoading } = useRollupRegistry()

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
