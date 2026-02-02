import { Icon } from "@/components/Icon"

interface RewardsLockedBannerProps {
  className?: string
}

/**
 * Banner showing that rewards are currently locked
 */
export const RewardsLockedBanner = ({ className = "" }: RewardsLockedBannerProps) => {
  return (
    <div className={`bg-amber-500/10 border border-amber-500/30 p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon name="lock" size="sm" className="text-amber-500 flex-shrink-0" />
        <div className="text-sm text-amber-200">
          <span className="font-bold">Rewards are currently locked.</span>
          <span className="text-amber-200/80 ml-1">
            Claiming will be enabled at a later date.
          </span>
        </div>
      </div>
    </div>
  )
}
