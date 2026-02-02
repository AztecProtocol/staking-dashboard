import { getValidatorDashboardProviderUrl } from "@/utils/validatorDashboardUtils"
import { Icon } from "@/components/Icon"

interface Provider {
  id: string
  website?: string
  email?: string
  adminAddress?: string
  description?: string
}

interface ProviderInfoProps {
  provider: Provider
}

/**
 * Component for displaying detailed provider information
 */
export const ProviderInfo = ({ provider }: ProviderInfoProps) => {
  return (
    <div className="space-y-6">
      <h4 className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/90 font-medium">
        Provider Information
      </h4>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Provider ID</div>
          <div className="font-mono text-sm text-parchment">{provider.id}</div>
        </div>

        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Website</div>
          {provider.website ? (
            <a href={provider.website} className="font-mono text-sm text-chartreuse hover:underline">
              {provider.website}
            </a>
          ) : (
            <div className="text-sm text-parchment/50 italic">No data available</div>
          )}
        </div>

        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Email</div>
          {provider.email ? (
            <div className="font-mono text-sm text-parchment">{provider.email}</div>
          ) : (
            <div className="text-sm text-parchment/50 italic">No data available</div>
          )}
        </div>

        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Admin Address</div>
          {provider.adminAddress ? (
            <div className="font-mono text-xs text-parchment break-all">{provider.adminAddress}</div>
          ) : (
            <div className="text-sm text-parchment/50 italic">No data available</div>
          )}
        </div>

        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Description</div>
          {provider.description ? (
            <p className="text-sm text-parchment/80 leading-relaxed">
              {provider.description}
            </p>
          ) : (
            <div className="text-sm text-parchment/50 italic">No data available</div>
          )}
        </div>

        <div>
          <div className="text-xs text-parchment/60 uppercase tracking-wide mb-1">Performance</div>
          <a
            href={getValidatorDashboardProviderUrl(provider.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-chartreuse hover:underline"
          >
            View on dashboard
            <Icon name="externalLink" size="sm" />
          </a>
        </div>
      </div>
    </div>
  )
}