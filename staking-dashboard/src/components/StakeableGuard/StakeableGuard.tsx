import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useATP } from "@/hooks/useATP"
import { useMultipleStakeableAmounts } from "@/hooks/atp/useMultipleStakeableAmounts"

interface StakeableGuardProps {
  children: ReactNode
}

/**
 * Route guard that redirects users to My Position if they don't have stakeable ATPs
 */
export const StakeableGuard = ({ children }: StakeableGuardProps) => {
  const { atpData } = useATP()
  const { stakeableAtps } = useMultipleStakeableAmounts(atpData)

  // If user has no stakeable ATPs, redirect to My Position with a message
  if (atpData.length > 0 && stakeableAtps.length === 0) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}