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
        className="btn-lime py-3 px-4 text-xs"
      >
        <div className="flex items-center justify-center gap-1">
          <Icon name="plus" size="md" />
          Run Your Own Node{totalValidatorCount > 1 ? 's' : ''}
        </div>
      </button>
      <button
        onClick={() => navigate('/providers')}
        className="btn-glass py-3 px-4 text-xs"
      >
        <div className="flex items-center justify-center gap-1">
          <Icon name="users" size="sm" />
          Delegate to Provider
        </div>
      </button>
    </div>
  )
}