import { useNavigate } from "react-router-dom"
import { Icon } from "@/components/Icon"

interface StakingActionButtonsProps {
  totalValidatorCount: number
}

/**
 * Component that displays action buttons for staking options
 */
export const StakingActionButtons = ({ totalValidatorCount }: StakingActionButtonsProps) => {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => navigate('/register-validator')}
        className="bg-chartreuse text-ink py-3 px-4 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-colors border border-chartreuse"
      >
        <div className="flex items-center justify-center gap-1">
          <Icon name="plus" size="md" />
          Run Your Own Node{totalValidatorCount > 1 ? 's' : ''}
        </div>
      </button>
      <button
        onClick={() => navigate('/providers')}
        className="bg-parchment/10 text-parchment py-3 px-4 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/20 transition-colors border border-parchment/30"
      >
        <div className="flex items-center justify-center gap-1">
          <Icon name="users" size="sm" />
          Delegate to Provider
        </div>
      </button>
    </div>
  )
}