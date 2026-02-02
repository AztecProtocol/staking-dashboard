import { createContext } from "react";
import type { ATPData, ATPHolding } from "../hooks/atp";

export interface ATPContextType {
  // ATP Factory data
  atpHoldings: ATPHolding[];
  isLoadingAtpHoldings: boolean;
  refetchAtpHoldings: () => void;

  // ATP data
  atpData: ATPData[];
  isLoadingAtpData: boolean;
  atpError: unknown;
  refetchAtpData: () => void;
}

export const ATPContext = createContext<ATPContextType | undefined>(undefined);
