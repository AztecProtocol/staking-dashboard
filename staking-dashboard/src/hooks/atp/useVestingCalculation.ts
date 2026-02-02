import { useMemo } from "react"
import { getCurrentEpochSeconds, epochToMilliseconds } from "@/utils/atpFormatters"

interface GlobalLock {
  startTime: bigint
  cliff: bigint
  endTime: bigint
  allocation: bigint
}

interface VestingTimePoint {
  date: Date
  label: string
  amount: bigint
  isClaimable: boolean
  isCurrent: boolean
}

interface VestingCalculation {
  timePoints: VestingTimePoint[]
  cliffUnlockRatio: number
  cliffUnlockAmount: bigint
  isAlreadyClaimable: boolean
  timeRemaining: number
  currentVestedAmount: bigint
}

/**
 * Calculate vesting timeline and amounts based on globalLock parameters
 */
export function useVestingCalculation(
  globalLock: GlobalLock
): VestingCalculation {
  return useMemo(() => {
    const now = getCurrentEpochSeconds()
    const timePoints: VestingTimePoint[] = []
    const totalAmount = globalLock.allocation
    const vestingStartTime = Number(globalLock.startTime)
    const cliffTime = Number(globalLock.cliff)
    const vestingEndTime = Number(globalLock.endTime)

    // Calculate cliff unlock based on time periods
    const totalPeriod = vestingEndTime - vestingStartTime
    const cliffPeriod = cliffTime - vestingStartTime

    // Handle instant unlock case (all dates are the same)
    const cliffUnlockRatio = totalPeriod === 0 ? 1 : cliffPeriod / totalPeriod
    const cliffUnlockAmount = totalPeriod === 0 ? totalAmount : BigInt(Math.floor(Number(totalAmount) * cliffUnlockRatio))

    // 1. Lock Start
    timePoints.push({
      date: new Date(epochToMilliseconds(vestingStartTime)),
      label: "Lock Start",
      amount: 0n,
      isClaimable: false,
      isCurrent: false
    })

    // 2. Cliff Date
    timePoints.push({
      date: new Date(epochToMilliseconds(cliffTime)),
      label: "Cliff",
      amount: cliffUnlockAmount,
      isClaimable: true,
      isCurrent: false
    })

    // 3. End Date
    timePoints.push({
      date: new Date(epochToMilliseconds(vestingEndTime)),
      label: "End",
      amount: totalAmount,
      isClaimable: true,
      isCurrent: false
    })

    // Calculate current vested amount
    let currentVestedAmount = 0n
    if (totalPeriod === 0) {
      // Instant unlock case - all tokens available immediately
      currentVestedAmount = totalAmount
    } else if (now >= vestingEndTime) {
      currentVestedAmount = totalAmount
    } else if (now >= cliffTime) {
      // After cliff: cliff amount + linear vesting of remaining
      const postCliffProgress = (now - cliffTime) / (vestingEndTime - cliffTime)
      const remainingAmount = totalAmount - cliffUnlockAmount
      const additionalAmount = BigInt(Math.floor(Number(remainingAmount) * postCliffProgress))
      currentVestedAmount = cliffUnlockAmount + additionalAmount
    }

    // 4. Current time
    timePoints.push({
      date: new Date(epochToMilliseconds(now)),
      label: "Now",
      amount: currentVestedAmount,
      isClaimable: now >= cliffTime,
      isCurrent: true
    })

    timePoints.sort((a, b) => a.date.getTime() - b.date.getTime())

    const isAlreadyClaimable = now >= cliffTime
    const timeRemaining = Math.max(0, cliffTime - now)

    return {
      timePoints,
      cliffUnlockRatio,
      cliffUnlockAmount,
      isAlreadyClaimable,
      timeRemaining,
      currentVestedAmount
    }
  }, [globalLock])
}