import { applyHeroItalics } from "@/utils/typographyUtils"
import { useNavigate } from "react-router-dom"
import { Icon } from "@/components/Icon"

export default function StakePortal() {
  const navigate = useNavigate()

  return (
    <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-light text-parchment mb-1 sm:mb-2 font-arizona-serif">
          {applyHeroItalics('Stake Your Tokens')}
        </h2>
        <p className="text-parchment/70 max-w-2xl mx-auto font-arizona-text">
          Choose how you want to stake your tokens
        </p>
      </div>

      {/* Options Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-5">
        {/* Delegate Option */}
        <div className="group glass p-3 sm:p-6 transition-all duration-200">

          {/* Card Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 glass flex items-center justify-center flex-shrink-0">
              <Icon name="users" className="w-4 h-4 sm:w-5 sm:h-5 text-parchment" />
            </div>
            <h3 className="text-lg sm:text-xl font-arizona-serif text-parchment">
              Delegate to Provider
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-md text-parchment/70 mb-2 sm:mb-3 leading-relaxed">
            Delegate your tokens to a provider. This is the simplest way to earn staking rewards without running your own infrastructure.
          </p>

          {/* Features */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>No technical setup required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>Choose from trusted providers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>Earn staking rewards passively</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-3 mt-3 border-t border-parchment/10">
            <button
              onClick={() => navigate("/providers")}
              className="w-full btn-glass py-3 px-4 text-sm"
            >
              Choose Provider →
            </button>
          </div>
        </div>

        {/* Run Own Node Option */}
        <div className="group glass p-3 sm:p-6 transition-all duration-200">

          {/* Card Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 glass flex items-center justify-center flex-shrink-0">
              <Icon name="server" className="w-4 h-4 sm:w-5 sm:h-5 text-parchment" />
            </div>
            <h3 className="text-lg sm:text-xl font-arizona-serif text-parchment">
              Run your own Sequencer
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-md text-parchment/70 mb-2 sm:mb-3 leading-relaxed">
            Register and run your own Aztec sequencer node. This gives you maximum control and potentially higher rewards, but requires technical expertise.
          </p>

          {/* Features */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>Full control over your node</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>Potentially higher rewards</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <Icon name="check" size="sm" className="text-accent flex-shrink-0" />
              <span>Contribute to network security</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-3 mt-3 border-t border-parchment/10">
            <button
              onClick={() => navigate("/register-validator")}
              className="w-full btn-lime py-3 px-4 text-sm"
            >
              Register Sequencer →
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}