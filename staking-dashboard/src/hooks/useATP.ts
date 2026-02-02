import { useContext } from "react";
import { ATPContext } from "../contexts/ATPContextType";

export function useATP() {
  const context = useContext(ATPContext);
  if (context === undefined) {
    throw new Error("useATP must be used within an ATPProvider");
  }
  return context;
}
