import { Icon } from "@/components/Icon"

interface RegistrationPreInfoProps {
  onStartRegistration: () => void
}

/**
 * Pre-registration information component that shows sequencer setup requirements,
 * registration steps overview, and links to documentation
 */
export const RegistrationPreInfo = ({ onStartRegistration }: RegistrationPreInfoProps) => {
  return (
    <div className="relative bg-parchment/5 border border-parchment/20 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-md-thermochrome text-2xl text-parchment mb-2">
          Sequencer Registration
        </h2>
        <p className="text-parchment/70 text-sm">
          Set up your sequencer node and stake tokens to participate in network consensus
        </p>
      </div>

      {/* Requirements */}
      <div className="mb-8">
        <h3 className="font-oracle-standard font-bold text-parchment text-sm mb-4 uppercase tracking-wide">
          Requirements
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-chartreuse mt-2 flex-shrink-0" />
            <div>
              <div className="text-sm text-parchment font-medium">Running sequencer node</div>
              <div className="text-xs text-parchment/60 mt-0.5">Active and synced with network</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-chartreuse mt-2 flex-shrink-0" />
            <div>
              <div className="text-sm text-parchment font-medium">Sequencer keystores</div>
              <div className="text-xs text-parchment/60 mt-0.5">Validator key files ready to upload</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-chartreuse mt-2 flex-shrink-0" />
            <div>
              <div className="text-sm text-parchment font-medium">Available to stake tokens</div>
              <div className="text-xs text-parchment/60 mt-0.5">Sufficient balance for staking</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-chartreuse mt-2 flex-shrink-0" />
            <div>
              <div className="text-sm text-parchment font-medium">Technical knowledge</div>
              <div className="text-xs text-parchment/60 mt-0.5">Node operation experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="mb-4 pb-8 border-b border-parchment/20">
        <h4 className="font-oracle-standard font-bold text-parchment text-sm mb-1">
          Need help setting up your sequencer?
        </h4>
        <p className="text-parchment/70 text-xs mb-4">
          Follow our guide to install and configure your sequencer node
        </p>
        <a
          href="https://docs.aztec.network/the_aztec_network/setup/sequencer_management"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-chartreuse text-chartreuse hover:bg-chartreuse/10 font-oracle-standard font-bold text-xs uppercase tracking-wide transition-colors"
        >
          View Setup Guide
          <Icon name="externalLink" size="md" />
        </a>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-parchment/80 text-sm mb-3">
          Ensure your sequencer is running before proceeding
        </p>
        <button
          onClick={onStartRegistration}
          className="bg-chartreuse text-ink px-8 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/90 transition-colors"
        >
          Start Registration
        </button>
      </div>
    </div>
  )
}