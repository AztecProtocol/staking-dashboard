import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRollupData } from "./rollup";
import { useSafeApp } from "./useSafeApp";
import type { ATPData } from "./atp";

/**
 * Hook to detect if user should be warned about not using Safe for batch transactions
 * Shows warning when:
 * 1. User has Token Vault(s) with >= 3x activation threshold
 * 2. User is NOT connected via Safe wallet
 */
export function useSafeWarning(atpData?: ATPData[], isLoadingAtpData?: boolean) {
  const { address, isConnected, connector } = useAccount();
  const { isSafeApp } = useSafeApp();
  const [shouldShowWarning, setShouldShowWarning] = useState(false);

  // Get activation threshold
  const { activationThreshold, isLoading: isLoadingThreshold } = useRollupData();

  useEffect(() => {
    // Reset warning when wallet disconnects
    if (!isConnected || !address) {
      setShouldShowWarning(false);
      return;
    }

    // Don't check if data is still loading
    if (isLoadingThreshold || isLoadingAtpData) {
      return;
    }

    // Check if previously dismissed
    const dismissalItem = localStorage.getItem(`safe-warning-dismissed-${address}`);
    if (dismissalItem) {
      try {
        const dismissalData = JSON.parse(dismissalItem);
        const now = Date.now();
        const expirationTime = dismissalData.timestamp + dismissalData.expiresIn;

        if (now < expirationTime) {
          setShouldShowWarning(false);
          return;
        } else {
          // Expired
          localStorage.removeItem(`safe-warning-dismissed-${address}`);
        }
      } catch {
        // Invalid data, remove it
        localStorage.removeItem(`safe-warning-dismissed-${address}`);
      }
    }

    // Check if running in Safe App environment
    if (isSafeApp) {
      setShouldShowWarning(false);
      return;
    }

    // Check if connector is Safe
    const isSafeConnector = connector?.name === 'Safe';
    if (isSafeConnector) {
      setShouldShowWarning(false);
      return;
    }

    // Check if any Token Vault has >= 3x activation threshold
    if (!activationThreshold || !atpData || atpData.length === 0) {
      setShouldShowWarning(false);
      return;
    }

    const thresholdLimit = activationThreshold * 3n;
    const hasLargeVault = atpData.some((atp) => atp.allocation && atp.allocation >= thresholdLimit);

    setShouldShowWarning(hasLargeVault);
  }, [isConnected, address, isLoadingThreshold, isLoadingAtpData, atpData, activationThreshold, connector, isSafeApp]);

  const dismissWarning = () => {
    setShouldShowWarning(false);
    // Store in localStorage with timestamp (expires after 7 days)
    if (address) {
      const dismissalData = {
        timestamp: Date.now(),
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(`safe-warning-dismissed-${address}`, JSON.stringify(dismissalData));
    }
  };

  return {
    shouldShowWarning,
    dismissWarning,
  };
}
