import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import SafeApiKit from "@safe-global/api-kit";
import { useChainId } from "wagmi";

interface SafeContextType {
  isSafeApp: boolean;
  sdk: SafeAppsSDK | null;
  apiKit: SafeApiKit | null;
}

const SafeContext = createContext<SafeContextType>({
  isSafeApp: false,
  sdk: null,
  apiKit: null,
});

/**
 * Provider component that initializes Safe SDK once at app root level
 * All components can access Safe state via useSafeApp hook
 */
export function SafeProvider({ children }: { children: ReactNode }) {
  const [isSafeApp, setIsSafeApp] = useState(false);
  const [sdk, setSdk] = useState<SafeAppsSDK | null>(null);
  const [apiKit, setApiKit] = useState<SafeApiKit | null>(null);
  const chainId = useChainId();

  useEffect(() => {
    console.log("SafeProvider: Initializing SDK");
    const safeAppsSDK = new SafeAppsSDK();

    const initSafeApp = async () => {
      try {
        const info = await safeAppsSDK.safe.getInfo();
        console.log("SAFE INFO", info);
        console.log("Safe address:", info.safeAddress);
        console.log("Chain ID:", info.chainId);
        setIsSafeApp(true);
        setSdk(safeAppsSDK);
      } catch (err) {
        console.log("Not in Safe environment");
        setIsSafeApp(false);
      }
    };

    initSafeApp();
  }, []); 

  // Update API Kit when chainId changes
  useEffect(() => {
    if (!isSafeApp) return;

    console.log("SafeProvider: Updating API Kit for chain", chainId);
    const apiKey = import.meta.env.VITE_SAFE_API_KEY;
    const safeApi = new SafeApiKit({
      chainId: BigInt(chainId),
      ...(apiKey && { apiKey }),
    });

    setApiKit(safeApi);
  }, [chainId, isSafeApp]);

  return (
    <SafeContext.Provider value={{ isSafeApp, sdk, apiKit }}>
      {children}
    </SafeContext.Provider>
  );
}

export function useSafeApp() {
  return useContext(SafeContext);
}
