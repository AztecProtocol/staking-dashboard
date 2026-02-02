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
      <div className={`text-center py-12 sm:py-16 ${className}`}>
        <div className="mb-6 sm:mb-8 px-4">
          <h3 className="font-md-thermochrome text-2xl sm:text-3xl mb-3 sm:mb-4 text-parchment">
            {title}
          </h3>
          <p className="font-arizona-text text-base sm:text-lg text-parchment/70 font-light max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            {description}
          </p>
        </div>

        <div className="bg-parchment/5 border border-parchment/20 p-6 sm:p-8 max-w-md mx-auto mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <CustomConnectButton
              connectVariant="primary"
              accountVariant="outline"
              size="lg"
              fullWidth={true}
            />
          </div>
          <p className="font-arizona-text text-sm text-parchment/60 px-2">
            {helpText}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}