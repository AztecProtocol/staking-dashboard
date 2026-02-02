import { useState, useEffect } from "react"
import { Button } from "@/components/ui"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useSafeApp } from "@/hooks/useSafeApp"
import { ConnectionModeModal } from "@/components/ConnectionModeModal"
import { useConnect } from "wagmi"

export interface CustomConnectButtonProps {
  /** Button variant for connect state */
  connectVariant?: "primary" | "secondary" | "outline" | "ghost" | "muted"
  /** Button variant for account state */
  accountVariant?: "primary" | "secondary" | "outline" | "ghost" | "muted"
  /** Button size */
  size?: "sm" | "default" | "lg" | "xl"
  /** Full width button */
  fullWidth?: boolean
  /** Custom className */
  className?: string
}

/**
 * Custom wallet connection button using RainbowKit
 * Provides styled connect/disconnect functionality with chain switching
 * Shows connection mode selection for Safe vs Direct wallet
 * Forces Safe connector when in Safe environment
 */
export const CustomConnectButton = ({
  connectVariant = "primary",
  accountVariant = "primary",
  size = "default",
  fullWidth = false,
  className = "",
}: CustomConnectButtonProps = {}) => {
  const [showModeModal, setShowModeModal] = useState(false)
  const { isSafeApp } = useSafeApp()
  const { connect, connectors } = useConnect()

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          // Auto-connect Safe connector when in Safe environment
          useEffect(() => {
            if (isSafeApp && !account) {
              const safeConnector = connectors.find(c => c.id === 'safe')
              if (safeConnector) {
                connect({ connector: safeConnector })
              }
            }
          }, [isSafeApp, account])

          const handleConnectClick = () => {
            // If already in Safe iframe, force Safe connector
            if (isSafeApp) {
              const safeConnector = connectors.find(c => c.id === 'safe')
              if (safeConnector) {
                connect({ connector: safeConnector })
              }
            } else {
              // Otherwise, show mode selection modal
              setShowModeModal(true);
            }
          };

          return (
            <>
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        variant={connectVariant}
                        size={size}
                        onClick={handleConnectClick}
                        fullWidth={fullWidth}
                        className={className}
                      >
                        Connect Wallet
                      </Button>
                    );
                  }

              if (chain.unsupported) {
                return (
                  <Button
                    variant="danger"
                    size={size}
                    onClick={openChainModal}
                    fullWidth={fullWidth}
                    className={className}
                  >
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
                  <Button
                    variant="outline"
                    size={size}
                    onClick={openChainModal}
                    className="hidden sm:inline-flex"
                  >
                    {chain.hasIcon && (
                      <div
                        className="w-3 h-3 overflow-hidden mr-1"
                        style={{ background: chain.iconBackground }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-3 h-3"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  <Button
                    variant={accountVariant}
                    size={size}
                    onClick={openAccountModal}
                    fullWidth={fullWidth}
                    className={className}
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </Button>
                </div>
              );
            })()}
          </div>

          {/* Connection Mode Modal */}
          <ConnectionModeModal
            isOpen={showModeModal}
            onClose={() => setShowModeModal(false)}
            onDirectConnect={openConnectModal}
          />
        </>
        );
      }}
    </ConnectButton.Custom>
    </>
  );
};