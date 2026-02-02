import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipIcon } from "@/components/Tooltip";
import { ATPDetailsModal } from "@/components/ATPDetailsModal";
import { useERC20TokenDetails } from "@/hooks/erc20";
import {
  useATPClaim,
  useUpgradeStaker,
  useUpdateStakerOperator,
} from "@/hooks/atp";
import { useTokenVaultSetupStatus } from "@/hooks/atp/useTokenVaultSetupStatus";
import { useRollupData } from "@/hooks/rollup/useRollupData";
import { useStakerBalance } from "@/hooks/staker/useStakerBalance";
import { useNCStakerStatus } from "@/hooks/staker/useNCStakerStatus";
import { useBlockTimestamp } from "@/hooks/useBlockTimestamp";
import { useTransactionCart } from "@/contexts/TransactionCartContext";
import {
  ATPStakingStepsWithTransaction,
  buildConditionalDependencies,
} from "@/contexts/ATPStakingStepsContext";
import { useATP } from "@/hooks/useATP";
import { formatAddress } from "@/utils/formatAddress";
import {
  getTimeToClaimForATP,
  formatTokenAmount,
  formatTokenAmountFull,
} from "@/utils/atpFormatters";
import type { ATPData } from "@/hooks/atp";
import { ERC20Abi } from "@/contracts/abis/ERC20";

interface ATPStakingCardProps {
  data: ATPData;
  onStakeClick: (atp: ATPData) => void;
  stakeableAmount?: bigint;
  isStakeable?: boolean;
  onClaimSuccess?: () => void;
}

export const ATPStakingCard = ({
  data,
  onStakeClick,
  stakeableAmount: stakeableAmountProp,
  isStakeable: isStakeableProp,
  onClaimSuccess,
}: ATPStakingCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address: connectedAddress } = useAccount();
  const { addTransaction, checkTransactionInQueue, openCart, transactions } =
    useTransactionCart();
  const { refetchAtpData, refetchAtpHoldings } = useATP();

  // Check if NCATP needs setup (v0 staker or zero operator)
  const {
    needsSetup,
    needsStakerUpgrade,
    needsOperatorUpdate,
    hasUpgradeAvailable,
    latestVersion,
    isLoading: isLoadingSetup,
    refetch: refetchSetupStatus,
  } = useTokenVaultSetupStatus({
    stakerAddress: data.staker as Address,
    atpAddress: data.atpAddress as Address,
    registryAddress: data.registry as Address,
    atpType: data.typeString,
  });
  const showSetupRequired = needsSetup && !isLoadingSetup;

  // Watch for completed setup transactions and refresh status
  const setupTransactionsComplete = useMemo(() => {
    const setupTxs = transactions.filter(
      (tx) => tx.type === "setup" && tx.metadata?.atpAddress === data.atpAddress
    );
    return (
      setupTxs.length > 0 && setupTxs.every((tx) => tx.status === "completed")
    );
  }, [transactions, data.atpAddress]);

  useEffect(() => {
    if (setupTransactionsComplete) {
      // Refetch setup status after a short delay to allow chain state to update
      const timer = setTimeout(() => {
        refetchSetupStatus();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [setupTransactionsComplete, refetchSetupStatus]);

  // Hooks for setup transactions
  const upgradeStakerHook = useUpgradeStaker(data.atpAddress as Address);
  const updateOperatorHook = useUpdateStakerOperator(
    data.atpAddress as Address
  );

  // Check if transactions are already in queue
  const upgradeTransaction = latestVersion
    ? upgradeStakerHook.buildRawTx(latestVersion)
    : null;
  const operatorTransaction = connectedAddress
    ? updateOperatorHook.buildRawTx(connectedAddress)
    : null;
  const isUpgradeInQueue = upgradeTransaction
    ? checkTransactionInQueue(upgradeTransaction)
    : false;
  const isOperatorInQueue = operatorTransaction
    ? checkTransactionInQueue(operatorTransaction)
    : false;

  const handleSetupTokenVault = () => {
    // Add operator update first (if needed)
    if (needsOperatorUpdate && connectedAddress && !isOperatorInQueue) {
      addTransaction(
        {
          type: "setup",
          label: "Set Operator",
          description: `Set operator to ${formatAddress(connectedAddress)}`,
          transaction: updateOperatorHook.buildRawTx(connectedAddress),
          metadata: {
            atpAddress: data.atpAddress,
            stepType: ATPStakingStepsWithTransaction.OperatorUpdate,
            stepGroupIdentifier: data.atpAddress,
          },
        },
        { preventDuplicate: true }
      );
    }

    // Add staker upgrade (if needed, with dependency on operator if both needed)
    if (needsStakerUpgrade && latestVersion && !isUpgradeInQueue) {
      addTransaction(
        {
          type: "setup",
          label: "Set Staker Version",
          description: `Upgrade to v${latestVersion.toString()}`,
          transaction: upgradeStakerHook.buildRawTx(latestVersion),
          metadata: {
            atpAddress: data.atpAddress,
            stepType: ATPStakingStepsWithTransaction.StakerUpgrade,
            stepGroupIdentifier: data.atpAddress,
            dependsOn: needsOperatorUpdate
              ? buildConditionalDependencies(data.atpAddress, [
                  {
                    condition: true,
                    stepType: ATPStakingStepsWithTransaction.OperatorUpdate,
                  },
                ])
              : [],
          },
        },
        { preventDuplicate: true }
      );
    }

    // Open the cart
    openCart();
  };

  const stakeableAmount = stakeableAmountProp ?? 0n;
  const isStakeable = isStakeableProp ?? false;
  const {
    claim,
    isPending,
    isConfirming,
    isSuccess: isClaimSuccess,
    needsApproval: hookNeedsApproval,
    allowance,
    isLoadingAllowance,
    approveStaker,
    isApprovePending,
    isApproveConfirming,
    refetchAllowance,
  } = useATPClaim(data);
  const globalLockTimeDisplay = getTimeToClaimForATP(data);
  const { activationThreshold } = useRollupData();

  const {
    symbol,
    decimals,
    isLoading: isLoadingToken,
  } = useERC20TokenDetails(data.token as `0x${string}`);

  const { balance: stakerBalance, isLoading: isLoadingStakerBalance } =
    useStakerBalance({
      stakerAddress: data.staker as `0x${string}`,
      enabled: !!data.staker,
    });

  // For NCATP, only operator can claim
  const isNCATP = data.typeString === "NCATP";
  const isOperator =
    connectedAddress?.toLowerCase() === data.operator?.toLowerCase();

  // Get raw vault balance for NCATP (not rounded like stakeableAmount)
  const { data: rawVaultBalance, refetch: refetchVaultBalance } =
    useReadContract({
      address: data.token as `0x${string}`,
      abi: ERC20Abi,
      functionName: "balanceOf",
      args: [data.atpAddress as `0x${string}`],
      query: {
        enabled: isNCATP && !!data.token && !!data.atpAddress,
      },
    });

  // Get cached block timestamp for withdrawal eligibility check (refreshes every 60s)
  const { blockTimestamp } = useBlockTimestamp();

  // Check NCATP staker status - uses block.timestamp for withdrawal eligibility
  const {
    hasStaked,
    canWithdraw,
    withdrawalTimestamp,
    isLoading: isLoadingNCStatus,
    refetch: refetchNCStatus,
  } = useNCStakerStatus({
    stakerAddress: data.staker as `0x${string}`,
    enabled: isNCATP && !!data.staker,
    blockTimestamp,
  });

  // Refetch data after successful claim/withdrawal
  useEffect(() => {
    if (isClaimSuccess) {
      // Refetch vault balance immediately (blockchain data)
      refetchVaultBalance();
      // Notify parent to refetch stakeable amounts
      onClaimSuccess?.();

      // Delay refetch of indexer data to give indexer time to process the event
      const timer = setTimeout(() => {
        refetchAtpHoldings(); // API data including totalWithdrawn
        refetchAtpData(); // Contract data
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    isClaimSuccess,
    refetchVaultBalance,
    refetchAtpHoldings,
    refetchAtpData,
    onClaimSuccess,
  ]);

  // For NCATP: must be operator AND hasStaked AND past withdrawal timestamp
  const canClaimNCATP = !isNCATP || (isOperator && hasStaked && canWithdraw);

  // Calculate NCATP-specific unlock display
  // Uses blockTimestamp (same as canWithdraw) to ensure consistency between display and button state
  const getNCAtpUnlockDisplay = (): string => {
    if (!isNCATP) return globalLockTimeDisplay;

    // Show loading state while fetching NCATP staker status
    if (isLoadingNCStatus) {
      return "Loading...";
    }

    // If staker doesn't support WITHDRAWAL_TIMESTAMP (legacy staker)
    if (withdrawalTimestamp === undefined) {
      return "Set Staker Version";
    }

    // If staker exists but hasn't staked yet
    if (!hasStaked) {
      return "Stake tokens first";
    }

    // Calculate countdown from WITHDRAWAL_TIMESTAMP using blockTimestamp for consistency
    // This ensures the countdown matches the button enabled state (both use blockchain time)
    const now = blockTimestamp
      ? Number(blockTimestamp)
      : Math.floor(Date.now() / 1000);
    const unlockTime = Number(withdrawalTimestamp);
    const timeLeft = unlockTime - now;

    if (timeLeft <= 0) {
      return "Available now";
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    if (days === 0) {
      const hours = Math.floor(timeLeft / (60 * 60));
      return `${hours} hours`;
    }

    return `${days} days`;
  };

  const timeToClaimDisplay = isNCATP
    ? getNCAtpUnlockDisplay()
    : globalLockTimeDisplay;

  // Calculate remaining allocation after withdrawals and slashing
  // Total Funds = allocation - totalWithdrawn - totalSlashed
  // Slashed tokens are burned/confiscated and should not appear as remaining funds
  const totalWithdrawn = data.totalWithdrawn || 0n;
  const totalSlashed = data.totalSlashed || 0n;
  let remainingAllocation =
    (data.allocation || 0n) - totalWithdrawn - totalSlashed;
  if (remainingAllocation < 0n && (totalWithdrawn > 0n || totalSlashed > 0n)) {
    console.error(
      `Data integrity issue: totalWithdrawn (${totalWithdrawn}) + totalSlashed (${totalSlashed}) exceeds allocation (${data.allocation}) for ATP ${data.atpAddress}. ` +
        `This indicates a problem with the indexer or smart contract.`
    );
    // Clamp to 0 to prevent negative display values
    remainingAllocation = 0n;
  }
  const isFullyWithdrawn =
    remainingAllocation <= 0n && (totalWithdrawn > 0n || totalSlashed > 0n);

  // Don't allow claiming if fully withdrawn (no tokens left in vault)
  // For NCATP: use rawVaultBalance instead of data.claimable (reports wrong value after withdrawal)
  // Note: stakeableAmount is rounded to multiples of activation threshold, so 194k shows as 0 (can't stake)
  // but rawVaultBalance correctly shows 194k as available to withdraw
  const effectiveClaimableForCheck = isNCATP
    ? (rawVaultBalance ?? 0n)
    : data.claimable || 0n;
  const isClaimable =
    effectiveClaimableForCheck > 0n && canClaimNCATP && !isFullyWithdrawn;
  // Track if we're processing OR just succeeded (keeps button disabled until data refreshes)
  const isClaimProcessing = isPending || isConfirming || isClaimSuccess;
  const isApproveProcessing = isApprovePending || isApproveConfirming;

  // Generate tooltip messages for disabled states
  const getStakeDisabledTooltip = () => {
    if (activationThreshold && stakeableAmount < activationThreshold) {
      const totalFunds = remainingAllocation;

      // Case 1: Total funds are less than activation threshold
      if (totalFunds < activationThreshold) {
        return `Your total funds (${formatTokenAmount(totalFunds, decimals, symbol)}) are less than the activation threshold (${formatTokenAmount(activationThreshold, decimals, symbol)}). Insufficient funds to stake.`;
      }

      // Case 2: Total funds are sufficient but stakeable amount is not (tokens already staked)
      return `Minimum to stake is ${formatTokenAmount(activationThreshold, decimals, symbol)} (activation threshold). Your tokens are already staked. Click Details for further information.`;
    }
    return "Cannot stake at this time. Click Details for further information.";
  };

  const getClaimDisabledTooltip = () => {
    if (isFullyWithdrawn) {
      return "All tokens have been withdrawn from this Token Vault";
    }
    if (isClaimProcessing) {
      return "Transaction in progress";
    }
    if (isNCATP) {
      if (!isOperator) {
        return "Only the operator can unlock tokens from this Token Vault";
      }
      if (!hasStaked) {
        return "Must stake tokens first before unlocking";
      }
      if (!canWithdraw && withdrawalTimestamp) {
        const withdrawalDate = new Date(Number(withdrawalTimestamp) * 1000);
        return `Withdrawal available after ${withdrawalDate.toLocaleString()}`;
      }
    }
    if (!data.claimable || data.claimable === 0n) {
      return "No tokens available to unlock. Tokens are still vesting and will become unlocked over time.";
    }
    return "Cannot unlock at this time";
  };

  const getApprovalTooltip = () => {
    return "Token approval required to allow the staker contract to transfer your unlocked tokens";
  };

  // Calculate allocation breakdown based on remaining allocation
  // For NCATP: "claimable" (available to withdraw) depends on unlock status
  //   - Not unlocked: 0 (can't withdraw yet)
  //   - Unlocked: full vault balance (raw, not rounded)
  // For LATP: claimable = vested tokens not yet withdrawn
  const effectiveClaimable = isNCATP
    ? canWithdraw
      ? (rawVaultBalance ?? 0n)
      : 0n // If unlocked: raw vault balance, else 0
    : (data.claimable && data.claimable > remainingAllocation
        ? remainingAllocation
        : data.claimable) || 0n;

  // Calculate locked and unlocked
  // For NCATP: locked = 0 (no vesting)
  // For LATP: unlocked = claimable (vested but not withdrawn), locked = remainingAllocation - unlocked
  // Note: remainingAllocation already accounts for withdrawals (allocation - totalWithdrawn)
  // So we don't subtract claimed again - that would double-count withdrawals
  const claimable = effectiveClaimable;
  const rawLocked = isNCATP
    ? 0n // NCATP has no vesting locks
    : remainingAllocation > 0n
      ? remainingAllocation - claimable
      : 0n;
  const locked = rawLocked < 0n ? 0n : rawLocked;

  // Determine if the badge should show LOCKED state
  // - NCATP: locked if withdrawal timestamp hasn't passed yet
  // - LATP: locked if there are tokens still vesting (locked > 0)
  const isLocked = isFullyWithdrawn
    ? false
    : isNCATP
      ? !canWithdraw
      : locked > 0n;

  // Clamp percentages to 0-100%
  const lockedPercent =
    remainingAllocation > 0n
      ? Math.min(
          100,
          Math.max(0, (Number(locked) / Number(remainingAllocation)) * 100)
        )
      : 0;
  const claimablePercent =
    remainingAllocation > 0n
      ? Math.min(
          100,
          Math.max(0, (Number(claimable) / Number(remainingAllocation)) * 100)
        )
      : 0;

  // For NCATP: calculate needsApproval based on actual vault balance (claimable), not data.claimable
  // The hook uses data.claimable which is wrong after withdrawals (reports full allocation)
  const needsApproval = isNCATP
    ? claimable > 0n && allowance !== undefined && allowance < claimable
    : hookNeedsApproval;

  // Show upgrade glow only when upgrade is available and setup isn't required
  const showUpgradeGlow = hasUpgradeAvailable && !showSetupRequired

  return (
    <div className={`relative bg-parchment/5 border p-8 hover:bg-parchment/8 transition-all ${
      showUpgradeGlow
        ? 'border-chartreuse/60 animate-pulse-glow'
        : 'border-parchment/20 hover:border-chartreuse/40'
    }`}>
      {/* Upgrade Available Badge - positioned on top border */}
      {showUpgradeGlow && (
        <span className="absolute -top-2.5 right-[15%] px-2 py-0.5 text-[10px] font-oracle-standard font-bold uppercase tracking-wider border border-chartreuse/60 bg-ink text-chartreuse">
          Upgrade Available
        </span>
      )}

      {/* Setup Required Overlay */}
      {showSetupRequired && (
        <div className="absolute inset-0 bg-ink/90 backdrop-blur-sm flex items-center justify-center z-10 border border-vermillion/30">
          <div className="text-center p-6 max-w-xs">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-chartreuse/40 bg-chartreuse/10">
              <Icon name="shield" className="w-6 h-6 text-chartreuse" />
            </div>
            <h3 className="font-md-thermochrome text-lg text-chartreuse mb-2">
              Setup Required
            </h3>
            <p className="text-parchment/70 text-sm mb-4">
              Complete the Token Vault setup to enable staking and withdrawal
              features.
            </p>
            <button
              onClick={handleSetupTokenVault}
              className="bg-chartreuse text-ink px-6 py-2 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment transition-all"
            >
              Setup Token Vault
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Left: Title + Status */}
        <div className="flex items-center gap-2">
          <h3 className="font-md-thermochrome text-2xl font-medium text-chartreuse">
            Token Vault #{data.sequentialNumber || "?"}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-oracle-standard font-bold uppercase tracking-wider border ${
              isFullyWithdrawn
                ? "bg-parchment/10 text-parchment/50 border-parchment/20"
                : isLocked
                  ? "bg-parchment/20 text-parchment border-parchment/40"
                  : "bg-chartreuse/20 text-chartreuse border-chartreuse/40"
            }`}
          >
            {isFullyWithdrawn ? "WITHDRAWN" : isLocked ? "LOCKED" : "UNLOCKED"}
          </span>
          <TooltipIcon
            content="These tokens are locked in a Token Vault contract. Token Vaults are vesting contracts that release tokens according to predefined schedules or milestones."
            size="sm"
            maxWidth="max-w-sm"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Details button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 border border-parchment/40 bg-parchment/10 hover:bg-parchment/20 hover:border-parchment/60 text-parchment font-oracle-standard font-bold text-xs uppercase tracking-wider px-3 py-1.5 transition-all"
        >
          <span>Details</span>
          <Icon name="arrowRight" size="sm" />
        </button>
      </div>

      {/* Total Funds - Full Width */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
              Total Funds
            </div>
            <TooltipIcon
              content="Total amount of tokens allocated in this Token Vault. This includes tokens that are still locked, currently claimable, and already claimed."
              size="sm"
              maxWidth="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
              Unlocks In
            </div>
            <TooltipIcon
              content={
                isNCATP
                  ? withdrawalTimestamp === undefined
                    ? "Set your Staker version to view unlock date. It is recommended that every Token Vault upgrades to the latest version."
                    : "Unlock requires staking tokens first. Then, your Token Vault unlock countdown will be displayed."
                  : "Time remaining until the next batch of tokens completes vesting and becomes claimable from your Token Vault."
              }
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-lg font-bold text-parchment">
            {formatTokenAmountFull(remainingAllocation, decimals, symbol)}
          </div>
          <div className="font-mono text-lg font-bold text-parchment">
            {isFullyWithdrawn ? "—" : timeToClaimDisplay}
          </div>
        </div>

        {/* Visualization - Only show for LATP (linear vesting) */}
        {remainingAllocation > 0n && data.typeString === "LATP" && (
          <div className="space-y-2">
            {/* Stacked Bar Chart */}
            <div className="flex h-12 overflow-hidden border border-parchment/20">
              {/* Locked */}
              {locked > 0n && (
                <div
                  className="bg-parchment/20 relative flex items-center justify-center"
                  style={{ width: `${lockedPercent}%` }}
                >
                  {lockedPercent > 15 && (
                    <span className="text-xs font-oracle-standard font-bold text-parchment/70">
                      {lockedPercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
              {/* Unlocked */}
              {claimable > 0n && (
                <div
                  className="bg-chartreuse relative flex items-center justify-center"
                  style={{ width: `${claimablePercent}%` }}
                >
                  {claimablePercent > 15 && (
                    <span className="text-xs font-oracle-standard font-bold text-ink">
                      {claimablePercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-parchment/20 border border-parchment/30"></div>
                <span className="text-parchment/70 font-oracle-standard">
                  Locked
                </span>
                <span className="text-parchment font-mono font-bold">
                  {formatTokenAmount(locked, decimals, symbol)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-chartreuse"></div>
                <span className="text-parchment/70 font-oracle-standard">
                  Available to Withdraw
                </span>
                <span className="text-chartreuse font-mono font-bold">
                  {formatTokenAmount(claimable, decimals, symbol)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="border-t border-parchment/10 mb-6" />

      {/* 2-Column Data Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {/* Stakable */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
              Available To Stake
            </div>
            <TooltipIcon
              content="Rounded down to valid stake amounts (multiples of 200,000 tokens)."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-lg font-bold text-chartreuse">
              {isLoadingToken || stakeableAmountProp === undefined
                ? "Loading..."
                : formatTokenAmount(stakeableAmount, decimals, symbol)}
            </div>
            {!isStakeable ? (
              <Tooltip
                content={getStakeDisabledTooltip()}
                position="top"
                maxWidth="max-w-xs"
              >
                <button
                  disabled={true}
                  className="font-oracle-standard font-bold text-xs uppercase tracking-wider px-2 py-1 transition-all flex-shrink-0 bg-parchment/20 text-parchment/40 cursor-not-allowed"
                >
                  Stake
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={() => onStakeClick(data)}
                className="font-oracle-standard font-bold text-xs uppercase tracking-wider px-2 py-1 transition-all flex-shrink-0 bg-chartreuse text-ink hover:bg-chartreuse/90"
              >
                Stake
              </button>
            )}
          </div>
          {stakerBalance > 0n && (
            <Tooltip
              content="Tokens held in your staker contract. These need to be withdrawn back to the Token Vault before they can be staked again."
              position="top"
              maxWidth="max-w-xs"
            >
              <div className="text-xs text-vermillion mt-1 cursor-help">
                {isLoadingStakerBalance
                  ? "Checking staker..."
                  : `+${formatTokenAmount(stakerBalance, decimals, symbol)} in staker awaiting withdrawal`}
              </div>
            </Tooltip>
          )}
        </div>

        {/* Available to Withdraw */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
              Available to Withdraw
            </div>
            <TooltipIcon
              content="Amount of vested tokens currently available to withdraw from your Token Vault. These tokens have completed their lock period and can be withdrawn."
              size="sm"
              maxWidth="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-3 flex-nowrap">
            <div className="font-mono text-lg font-bold text-chartreuse whitespace-nowrap">
              {formatTokenAmount(
                isFullyWithdrawn ? 0n : claimable,
                decimals,
                symbol
              )}
            </div>
            {isClaimable && needsApproval ? (
              <Tooltip
                content={getApprovalTooltip()}
                position="top"
                maxWidth="max-w-xs"
              >
                <button
                  onClick={() => approveStaker(claimable)}
                  disabled={isApproveProcessing || isLoadingAllowance}
                  className="font-oracle-standard font-bold text-xs uppercase tracking-wider px-2 py-1 transition-all flex-shrink-0 bg-chartreuse text-ink hover:bg-chartreuse/90 disabled:bg-parchment/20 disabled:text-parchment/40 disabled:cursor-not-allowed"
                >
                  {isApprovePending
                    ? "Approving..."
                    : isApproveConfirming
                      ? "Confirming..."
                      : "Approve"}
                </button>
              </Tooltip>
            ) : !isClaimable || isClaimProcessing ? (
              <Tooltip
                content={getClaimDisabledTooltip()}
                position="top"
                maxWidth="max-w-xs"
              >
                <button
                  disabled={true}
                  className="font-oracle-standard font-bold text-xs uppercase tracking-wider px-2 py-1 transition-all flex-shrink-0 bg-parchment/20 text-parchment/40 cursor-not-allowed"
                >
                  {isPending
                    ? "Withdrawing..."
                    : isConfirming
                      ? "Confirming..."
                      : isClaimSuccess
                        ? "Success!"
                        : isNCATP
                          ? "Withdraw Tokens"
                          : "Unlock"}
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={claim}
                className="font-oracle-standard font-bold text-xs uppercase tracking-wider px-2 py-1 transition-all flex-shrink-0 bg-chartreuse text-ink hover:bg-chartreuse/90"
              >
                {isNCATP ? "Withdraw Tokens" : "Unlock"}
              </button>
            )}
          </div>
        </div>

        {/* Withdrawn */}
        {totalWithdrawn > 0n && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <div className="text-xs text-parchment/60 uppercase tracking-wide font-oracle-standard">
                Withdrawn
              </div>
              <TooltipIcon
                content="Total amount of tokens withdrawn from this Token Vault to your wallet."
                size="sm"
                maxWidth="max-w-xs"
              />
            </div>
            <div className="font-mono text-lg font-bold text-parchment">
              {formatTokenAmount(totalWithdrawn, decimals, symbol)}
            </div>
          </div>
        )}
      </div>

      {/* ATP Details Modal */}
      <ATPDetailsModal
        atp={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWithdrawSuccess={onClaimSuccess}
        onRefetchAllowance={refetchAllowance}
        onUpgradeSuccess={refetchNCStatus}
      />
    </div>
  );
};
