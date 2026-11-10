import { CustomConnectButton } from "@/components/CustomConnectButton"
import type { ReactNode } from "react"
import { useAccount } from "wagmi"

interface WalletConnectGuardProps {
  children: ReactNode
  title?: string
  description?: string
  helpText?: string
  className?: string
}

/**
 * Reusable guard component that shows connect wallet UI when wallet is not connected
 * Following Single Responsibility Principle - only handles wallet connection state
 * Matches the WalletNotConnectedState design pattern
 */
export const WalletConnectGuard = ({
  children,
  title = "Connect Your Wallet",
  description = "Connect your wallet to continue with staking operations.",
  helpText = "After connecting, you'll be able to stake tokens and manage your positions.",
  className = ""
}: WalletConnectGuardProps) => {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className={`card-light text-center px-4 sm:px-8 py-12 sm:py-16 ${className}`}>
        <div className="mb-8 sm:mb-10">
          <h3 className="font-arizona-serif font-light text-3xl sm:text-4xl lg:text-5xl leading-none tracking-tight-5 mb-4 text-parchment">
            {title}
          </h3>
          <p className="font-oracle-standard text-base sm:text-lg leading-snug text-parchment/70 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="glass p-6 sm:p-8 max-w-md mx-auto">
          <div className="mb-4 sm:mb-5">
            <CustomConnectButton
              connectVariant="primary"
              accountVariant="outline"
              size="lg"
              fullWidth={true}
            />
          </div>
          <p className="font-oracle-standard text-sm leading-snug text-parchment/60 px-2">
            {helpText}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
