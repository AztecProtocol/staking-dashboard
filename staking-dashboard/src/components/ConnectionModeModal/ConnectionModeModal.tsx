import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { useSafeAppUrl } from "@/hooks/useSafeApp";
import { useChainId } from "wagmi";

interface ConnectionModeModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when direct wallet option is selected */
  onDirectConnect: () => void;
}

/**
 * Modal for selecting connection mode: Safe or Direct wallet
 * Shows guidance for opening app in Safe or connecting browser wallet
 */
export function ConnectionModeModal({ isOpen, onClose, onDirectConnect }: ConnectionModeModalProps) {
  const [safeAddress, setSafeAddress] = useState("");
  const [showSafeInput, setShowSafeInput] = useState(false);
  const { openInSafe, generateSafeAppUrl } = useSafeAppUrl();
  const chainId = useChainId();

  if (!isOpen) return null;

  // Generate preview URL if address is valid
  const previewUrl = safeAddress.trim() ? generateSafeAppUrl(safeAddress) : null;

  const handleClose = () => {
    onClose();
    setShowSafeInput(false);
    setSafeAddress("");
  };

  const handleSafeOption = () => {
    setShowSafeInput(true);
  };

  const handleOpenInSafe = () => {
    if (!safeAddress.trim()) return;
    openInSafe(safeAddress);
    handleClose();
  };

  const handleDirectConnect = () => {
    handleClose();
    onDirectConnect();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
      <div className="bg-parchment border border-ink/20 max-w-2xl w-full relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-ink/50 hover:text-ink transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-arizona-serif text-ink mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-base font-oracle-standard text-ink/60 mb-8">
            Choose how you want to connect to the staking dashboard
          </p>

          {!showSafeInput ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Safe Option */}
              <button
                onClick={handleSafeOption}
                className="group p-6 border border-ink/20 hover:border-ink/40 transition-all duration-200 text-center bg-parchment hover:bg-ink/5"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-ink/10 mx-auto mb-4">
                  <svg className="w-6 h-6 text-ink" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-oracle-triple-medium text-ink mb-2">
                  Open in Safe
                </h3>
                <p className="text-sm font-oracle-standard text-ink/60 mb-3 leading-relaxed">
                  For multisig wallets and enhanced security. Opens through Safe's official interface.
                </p>
                <div className="text-xs font-oracle-standard text-ink/50">
                  Recommended for teams
                </div>
              </button>

              {/* Direct Wallet Option */}
              <button
                onClick={handleDirectConnect}
                className="group p-6 border border-ink/20 hover:border-ink/40 transition-all duration-200 text-center bg-parchment hover:bg-ink/5"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-ink/10 mx-auto mb-4">
                  <svg className="w-6 h-6 text-ink" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-oracle-triple-medium text-ink mb-2">
                  Browser Wallet
                </h3>
                <p className="text-sm font-oracle-standard text-ink/60 mb-3 leading-relaxed">
                  Direct connection using MetaMask, Rainbow, Coinbase, or other wallets.
                </p>
                <div className="text-xs font-oracle-standard text-ink/50">
                  Quick & simple
                </div>
              </button>
            </div>
          ) : (
            /* Safe Address Input */
            <div className="space-y-5">
              <div>
                <label htmlFor="safe-address" className="block text-sm font-oracle-triple-medium text-ink mb-2">
                  Enter Your Safe Address
                </label>
                <input
                  id="safe-address"
                  type="text"
                  value={safeAddress}
                  onChange={(e) => setSafeAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-ink/20 bg-parchment text-ink font-oracle-standard text-sm focus:border-ink/40 focus:outline-none transition-colors"
                />
                <p className="mt-2 text-xs font-oracle-standard text-ink/50">
                  Opens through Safe's official interface on{" "}
                  <span className="font-oracle-triple-medium">
                    {chainId === 1 ? "Ethereum Mainnet" : chainId === 11155111 ? "Sepolia Testnet" : "Ethereum"}
                  </span>
                </p>

                {/* URL Preview */}
                {previewUrl && (
                  <div className="mt-3 p-3 bg-ink/5 border border-ink/10">
                    <p className="text-xs font-oracle-triple-medium text-ink mb-1">Preview URL:</p>
                    <p className="text-xs font-oracle-standard text-ink/60 break-all leading-relaxed">
                      {previewUrl}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={handleOpenInSafe}
                  disabled={!safeAddress.trim()}
                  className="flex-1"
                >
                  Open in Safe
                </Button>
                <Button
                  variant="dark"
                  onClick={() => {
                    setShowSafeInput(false);
                    setSafeAddress("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>

              <div className="p-4 bg-ink/5 border border-ink/10">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-ink/60 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-oracle-triple-medium text-ink mb-1">
                      What happens next:
                    </p>
                    <ol className="text-xs font-oracle-standard text-ink/60 leading-relaxed space-y-1.5 list-decimal list-inside">
                      <li>Opens <span className="font-oracle-triple-medium">app.safe.global</span> in a new tab</li>
                      <li>Connect your signer wallet on Safe (MetaMask, WalletConnect, etc.)</li>
                      <li>This staking app loads with your Safe address connected</li>
                    </ol>
                    {safeAddress.trim() && (
                      <p className="text-xs font-oracle-standard text-ink/50 mt-3 break-all">
                        Safe address: <span className="font-oracle-triple-medium text-ink/60">{safeAddress.trim()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
