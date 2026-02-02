import { useCallback } from "react";
import { useChainId } from "wagmi";

const SAFE_NETWORK_PREFIXES: Record<number, string> = {
  1: "eth",
  11155111: "sep",
};

// Re-export useSafeApp from SafeContext
export { useSafeApp } from "../contexts/SafeContext";

/**
 * Hook to get Safe network prefix for current chain
 * Returns the network prefix used in Safe app URLs (e.g., "eth", "sep")
 */
export function useSafeNetworkPrefix(): string {
  const chainId = useChainId();
  return SAFE_NETWORK_PREFIXES[chainId] || "eth";
}

/**
 * Hook to generate Safe app URL
 * Returns a function that creates a Safe app URL for a given Safe address
 */
export function useSafeAppUrl() {
  const networkPrefix = useSafeNetworkPrefix();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const generateSafeAppUrl = useCallback((safeAddress: string): string => {
    return `https://app.safe.global/apps/open?safe=${networkPrefix}:${safeAddress.trim()}&appUrl=${encodeURIComponent(appUrl)}`;
  }, [networkPrefix, appUrl]);

  const openInSafe = useCallback((safeAddress: string): void => {
    const safeUrl = generateSafeAppUrl(safeAddress);
    window.open(safeUrl, "_blank");
  }, [generateSafeAppUrl]);

  return {
    networkPrefix,
    appUrl,
    generateSafeAppUrl,
    openInSafe,
  };
}
