import type { ReactNode } from "react";
import { useAtpHoldings } from "../hooks/atp";
import { ATPContext, type ATPContextType } from "./ATPContextType";
import { useMultipleAtpData } from "../hooks/atp/useMultipleAtpData";

export function ATPProvider({ children }: { children: ReactNode }) {
  const { atpHoldings, isLoading: isLoadingAtpHoldings, refetch: refetchAtpHoldings } = useAtpHoldings();

  const {
    data: atpData,
    isLoading: isLoadingAtpData,
    error: atpError,
    refetch: refetchAtpData,
  } = useMultipleAtpData(atpHoldings);

  const value: ATPContextType = {
    atpHoldings,
    isLoadingAtpHoldings,
    refetchAtpHoldings,
    atpData,
    isLoadingAtpData,
    atpError,
    refetchAtpData,
  };

  return <ATPContext.Provider value={value}>{children}</ATPContext.Provider>;
}
