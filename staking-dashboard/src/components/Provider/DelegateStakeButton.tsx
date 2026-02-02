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
      className="w-full bg-chartreuse text-ink py-4 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Delegate Stake
    </button>
  )
}
