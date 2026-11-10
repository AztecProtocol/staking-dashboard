interface DelegateStakeButtonProps {
  onClick: () => void
  disabled?: boolean
}

/**
 * Simple button to initiate the delegation staking flow
 * Opens the staking modal when clicked
 */
export const DelegateStakeButton = ({ onClick, disabled }: DelegateStakeButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full btn-lime py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Delegate Stake
    </button>
  )
}
