import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import type { ProviderListItem } from "./useProviderTable"

interface DisclaimerProvider {
  id: string
  name: string
  rank: number
}

/**
 * Hook for managing decentralization disclaimer logic
 */
export const useProviderDisclaimer = (allProviders: ProviderListItem[]) => {
  const navigate = useNavigate()
  const [disclaimerProvider, setDisclaimerProvider] = useState<DisclaimerProvider | null>(null)

  // Pre-calculate top 10 providers to avoid sorting on every click
  const topProviderIds = useMemo(() => {
    const sorted = [...allProviders].sort((a, b) =>
      parseFloat(b.totalStaked) - parseFloat(a.totalStaked)
    )
    return new Map(sorted.slice(0, 10).map((v, index) => [v.id, index + 1]))
  }, [allProviders])

  const handleStakeClick = useCallback((provider: ProviderListItem, event: React.MouseEvent) => {
    event.stopPropagation()

    const providerRank = topProviderIds.get(provider.id)

    // Don't show disclaimer if TVL or delegators is 0
    const hasZeroTVL = parseFloat(provider.totalStaked) === 0
    const hasZeroDelegators = provider.delegators === 0

    if (providerRank && !hasZeroTVL && !hasZeroDelegators) {
      setDisclaimerProvider({
        id: provider.id,
        name: provider.name,
        rank: providerRank
      })
    } else {
      navigate(`/providers/${provider.id}`)
    }
  }, [topProviderIds, navigate])

  const handleDisclaimerProceed = useCallback(() => {
    if (disclaimerProvider) {
      navigate(`/providers/${disclaimerProvider.id}`)
      setDisclaimerProvider(null)
    }
  }, [disclaimerProvider, navigate])

  const handleDisclaimerCancel = useCallback(() => {
    setDisclaimerProvider(null)
  }, [])

  return {
    disclaimerProvider,
    handleStakeClick,
    handleDisclaimerProceed,
    handleDisclaimerCancel
  }
}