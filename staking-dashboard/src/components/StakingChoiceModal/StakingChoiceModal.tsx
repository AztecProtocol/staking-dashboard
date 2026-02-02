import { useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import { useATPSelection } from "@/contexts/ATPSelectionContext"
import { TooltipIcon } from "@/components/Tooltip"
import { Icon } from "@/components/Icon"
import type { ATPData } from "@/hooks/atp/atpTypes"

interface StakingChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAtp: ATPData | null
}

export const StakingChoiceModal = ({ isOpen, onClose, selectedAtp }: StakingChoiceModalProps) => {
  const navigate = useNavigate()
  const { setSelectedAtp } = useATPSelection()

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleStakeOwnNode = () => {
    // Store ATP in context for Register Validator flow
    if (selectedAtp) {
      setSelectedAtp(selectedAtp, "self-stake")
    }
    navigate('/register-validator')
    onClose()
  }

  const handleDelegateToProvider = () => {
    // Store ATP in context for Delegation flow
    if (selectedAtp) {
      setSelectedAtp(selectedAtp, "delegation")
    }
    navigate('/providers')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-ink border border-parchment/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h1 className="font-arizona-serif text-4xl font-light leading-100 tracking-tight-5 text-parchment">
                Choose Your <em className="italic">Staking</em> Method
              </h1>
              <TooltipIcon
                content="Select between delegating to an existing sequencer or running your own."
                size="lg"
                maxWidth="max-w-md"
              />
            </div>
            <button
              onClick={onClose}
              className="text-parchment/60 hover:text-parchment transition-colors p-2"
              aria-label="Close modal"
            >
              <Icon name="x" size="lg" />
            </button>
          </div>

          {/* Options - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Delegate to Operator Option */}
            <div className="bg-parchment/5 border border-parchment/20 p-6 hover:border-chartreuse/50 hover:bg-chartreuse/5 transition-all">
              <div className="flex flex-col items-center text-center h-full">
                {/* Icon */}
                <div className="w-20 h-20 mb-4 flex items-center justify-center border border-parchment/30">
                  <Icon name="users" className="w-10 h-10 text-parchment" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-oracle-triple-book text-xl font-medium leading-100 text-parchment">
                    Delegate to Provider
                  </h2>
                  <TooltipIcon
                    content="Delegate your AZTEC token to a registered Delegate for a commission, who handles all technical aspects while you earn staking rewards."
                    maxWidth="max-w-sm"
                  />
                </div>

                <p className="font-oracle-standard text-sm font-medium leading-140 tracking-tight-2 text-parchment/70 mb-6">
                  Delegate your tokens to an existing provider. This is perfect if you don't want to run your own infrastructure.
                </p>

                <button
                  onClick={handleDelegateToProvider}
                  className="w-full mt-auto bg-chartreuse text-ink py-3 px-6 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg"
                >
                  Browse Delegates
                </button>
              </div>
            </div>

            {/* Register Your Validator Option */}
            <div className="bg-parchment/5 border border-parchment/20 p-6 hover:border-chartreuse/50 hover:bg-chartreuse/5 transition-all">
              <div className="flex flex-col items-center text-center h-full">
                {/* Icon */}
                <div className="w-20 h-20 mb-4 flex items-center justify-center border border-parchment/30">
                  <Icon name="shield" className="w-10 h-10 text-parchment" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-oracle-triple-book text-xl font-medium leading-100 text-parchment">
                    Register Your Sequencer
                  </h2>
                  <TooltipIcon
                    content="Run your own sequencer on the network, like a solo staker. Register as a sequencer to run your own staking node. This requires technical knowledge, infrastructure management, and a minimum of 200,000 AZTEC tokens."
                    maxWidth="max-w-sm"
                  />
                </div>

                <p className="font-oracle-standard text-sm font-medium leading-140 tracking-tight-2 text-parchment/70 mb-6">
                  Register as a sequencer if you're already running your own sequencer and want others to delegate to you.
                </p>

                <button
                  onClick={handleStakeOwnNode}
                  className="w-full mt-auto bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 px-6 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-chartreuse hover:text-ink hover:border-chartreuse transition-all duration-300"
                >
                  Stake Own Node
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}