import { Icon } from "@/components/Icon";
import { AvatarImage } from "@/components/AvatarImage";
import { CopyButton } from "@/components/CopyButton";
import { TooltipIcon } from "@/components/Tooltip";
import { openAddressInExplorer } from "@/utils/explorerUtils";
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry";
import { useProviderQueueLength } from "@/hooks/stakingRegistry/useProviderQueueLength";
import { formatTokenAmount, stringToBigInt } from "@/utils/atpFormatters";

interface Provider {
  name: string;
  logo_url?: string;
  totalStaked: string;
  percentage: string;
  commission: string;
  delegators: string;
  address: string;
  id: string;
}

interface ProviderOverviewProps {
  provider: Provider;
}

/**
 * Component for displaying provider overview with logo, name and key metrics
 */
export const ProviderOverview = ({ provider }: ProviderOverviewProps) => {
  const { symbol, decimals, isLoading: isTokenLoading } = useStakingAssetTokenDetails();
  const { queueLength } = useProviderQueueLength(Number(provider.id));

  const currentStake = decimals
    ? formatTokenAmount(stringToBigInt(provider.totalStaked), decimals, symbol)
    : '---';
  return (
    <div className="bg-parchment/5 border border-parchment/20 p-4 sm:p-6 overflow-x-auto">
      {/* Provider Header */}
      <div className="flex items-center space-x-4 mb-6">
        <AvatarImage
          src={provider.logo_url}
          alt={`${provider.name} logo`}
          size="lg"
          className="w-12 h-12"
        />
        <div>
          <h4 className="font-oracle-triple-book text-xl font-medium text-parchment">
            {provider.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-parchment/60 font-mono">
              {provider.address.slice(0, 8)}...{provider.address.slice(-6)}
            </span>
            <CopyButton text={provider.address} size="sm" className="p-0.5" />
            <button
              onClick={() => openAddressInExplorer(provider.address)}
              className="p-1 text-parchment/60 hover:text-chartreuse transition-colors"
              title="View in explorer"
            >
              <Icon name="externalLink" size="sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-parchment/5 border border-parchment/20 p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">
              Current Stake
            </div>
            <TooltipIcon
              content="Total amount currently staked with this operator and their percentage of the total network stake."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          {isTokenLoading ? (
            <div className="h-6 w-32 bg-chartreuse/20 animate-pulse rounded"></div>
          ) : (
            <div className="font-mono text-chartreuse font-bold text-lg">
              {currentStake}
            </div>
          )}
          <div className="text-xs text-parchment/60">{provider.percentage}</div>
        </div>

        <div className="bg-parchment/5 border border-parchment/20 p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">
              Commission
            </div>
            <TooltipIcon
              content="Fee percentage taken by the provider from your staking rewards. Lower commission means more rewards for you."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-chartreuse font-bold text-lg">
            {provider.commission}
          </div>
        </div>

        <div className="bg-parchment/5 border border-parchment/20 p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">
              Keys Available
            </div>
            <TooltipIcon
              content="Number of sequencer key slots available with this provider. This is the remaining queue capacity for new delegations."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-parchment font-bold text-lg">
            {queueLength}
          </div>
        </div>

        <div className="bg-parchment/5 border border-parchment/20 p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide">
              Delegators
            </div>
            <TooltipIcon
              content="Number of users currently delegating their tokens to this provider."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="font-mono text-parchment font-bold text-lg">
            {provider.delegators}
          </div>
        </div>

      </div>
    </div>
  );
};
