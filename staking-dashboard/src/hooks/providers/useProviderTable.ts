import { useState, useMemo, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { config } from "@/config"

/**
 * Provider data structure for table/list display
 */
export interface ProviderListItem {
  id: string
  name: string
  commission: number
  delegators: number
  totalStaked: string
  address: string
  description: string
  website: string
  logo_url: string
  percentage: string
  cumulativePercentage: string
}

export interface NotAssociatedStake {
  delegators: number;
  totalStaked: string;
  percentage: string;
  cumulativePercentage: string;
}

export interface ProvidersResponse {
  providers: ProviderListItem[];
  totalStaked: string;
  notAssociatedStake?: NotAssociatedStake;
}

export type SortField = 'name' | 'totalStaked' | 'commission'
export type SortDirection = 'asc' | 'desc'

/**
 * Fetch providers from API
 */
async function fetchProviders(): Promise<ProvidersResponse> {
  const response = await fetch(`${config.apiHost}/api/providers`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  return {
    providers: data.providers ?? [],
    totalStaked: data.totalStaked ?? '',
    notAssociatedStake: data.notAssociatedStake
  }
}

/**
 * Calculate provider percentage and cumulative percentage
 */
function enrichProviderWithPercentages(
  provider: ProviderListItem,
  networkTotalStake: number,
  cumulativePercentage: number
): { provider: ProviderListItem; newCumulative: number } {
  const totalStake = parseFloat(provider.totalStaked ?? '0')
  const percentage = networkTotalStake > 0 ? ((totalStake / networkTotalStake) * 100) : 0
  const newCumulative = cumulativePercentage + percentage

  return {
    provider: {
      ...provider,
      percentage: `${percentage.toFixed(1)}%`,
      cumulativePercentage: `${newCumulative.toFixed(1)}%`,
    },
    newCumulative
  }
}

/**
 * Filter provider by search query
 */
function matchesSearchQuery(provider: ProviderListItem, query: string): boolean {
  if (!query) return true
  const lowerQuery = query.toLowerCase()
  return (
    provider.name.toLowerCase().includes(lowerQuery) ||
    provider.address?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get sort value from provider based on field
 */
function getSortValue(provider: ProviderListItem, field: SortField): string | number {
  switch (field) {
    case 'name':
      return provider.name.toLowerCase()
    case 'totalStaked':
      return parseFloat(provider.totalStaked)
    case 'commission':
      return provider.commission
  }
}

/**
 * Compare two values for sorting
 */
function compareValues(a: string | number, b: string | number, direction: SortDirection): number {
  if (direction === 'asc') {
    return a < b ? -1 : a > b ? 1 : 0
  } else {
    return a > b ? -1 : a < b ? 1 : 0
  }
}

/**
 * Hook for managing provider table state and operations
 */
export const useProviderTable = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>('totalStaked')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const tableTopRef = useRef<HTMLDivElement>(null)

  const itemsPerPage = 10

  const { data: providersData, isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: fetchProviders,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const providers = providersData?.providers ?? []
  const totalStaked = providersData?.totalStaked ?? ''
  const rawNotAssociatedStake = providersData?.notAssociatedStake

  // Format API data to match expected structure with percentages
  const allProviders = useMemo(() => {
    const networkTotalStake = parseFloat(totalStaked)

    // Sort by stake descending to calculate cumulative percentages
    const sortedProviders = [...providers].sort((a, b) =>
      parseFloat(b.totalStaked ?? '0') - parseFloat(a.totalStaked ?? '0')
    )

    // Calculate cumulative percentages for acknowledged providers first
    let cumulativePercentage = 0
    const enrichedProviders: ProviderListItem[] = []

    for (const provider of sortedProviders) {
      const { provider: enrichedProvider, newCumulative } = enrichProviderWithPercentages(
        provider,
        networkTotalStake,
        cumulativePercentage
      )
      enrichedProviders.push(enrichedProvider)
      cumulativePercentage = newCumulative
    }

    return enrichedProviders
  }, [providers, totalStaked])

  // Calculate percentage and cumulative percentage for notAssociatedStake
  const notAssociatedStake = useMemo(() => {
    if (!rawNotAssociatedStake) return undefined

    const networkTotalStake = parseFloat(totalStaked)
    const notAssociatedStakeValue = parseFloat(rawNotAssociatedStake.totalStaked ?? '0')
    const percentage = networkTotalStake > 0 ? ((notAssociatedStakeValue / networkTotalStake) * 100) : 0

    // Get the last provider's cumulative percentage
    const lastProvider = allProviders[allProviders.length - 1]
    const providersCumulative = lastProvider ? parseFloat(lastProvider.cumulativePercentage) : 0
    const cumulativePercentage = providersCumulative + percentage

    return {
      ...rawNotAssociatedStake,
      percentage: `${percentage.toFixed(1)}%`,
      cumulativePercentage: `${cumulativePercentage.toFixed(1)}%`
    }
  }, [rawNotAssociatedStake, totalStaked, allProviders])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const filteredAndSortedProviders = useMemo(() => {
    return allProviders
      .filter(provider => matchesSearchQuery(provider, searchQuery))
      .sort((a, b) => {
        const aValue = getSortValue(a, sortField)
        const bValue = getSortValue(b, sortField)
        return compareValues(aValue, bValue, sortDirection)
      })
  }, [allProviders, searchQuery, sortField, sortDirection])

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedProviders.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const providers = filteredAndSortedProviders.slice(startIndex, endIndex)

    return { totalPages, startIndex, endIndex, providers }
  }, [filteredAndSortedProviders, currentPage])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Scroll to top when page changes
  useEffect(() => {
    if (tableTopRef.current && currentPage > 1) {
      tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentPage])

  return {
    providers: paginationData.providers,
    allProviders: filteredAndSortedProviders,
    totalStaked,
    notAssociatedStake,

    isLoading,
    error: error?.message ?? null,

    currentPage,
    totalPages: paginationData.totalPages,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    setCurrentPage,

    searchQuery,
    handleSearchChange,

    sortField,
    sortDirection,
    handleSort,

    tableTopRef
  }
}