import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { Icon } from "@/components/Icon";
import {
  useGovernanceDeposit,
  useUserGovernancePower,
  useDepositIntoGovernance,
  type StakerVotingPower,
} from "@/hooks/governance";
import { useAllowance, useApproveERC20 } from "@/hooks/erc20";
import { useApproveStaker, useUpgradeStaker, useUpdateStakerOperator } from "@/hooks/atp";
import { useStakerGovernanceSupport } from "@/hooks/staker";
import type { ATPHolding } from "@/hooks/atp";
import { contracts } from "@/contracts";
import { ERC20Abi } from "@/contracts/abis/ERC20";
import { useAlert } from "@/contexts/AlertContext";
import { formatTokenAmount } from "@/utils/atpFormatters";

// Deposit source can be "wallet" or an ATP
type DepositSource =
  | { type: "wallet" }
  | { type: "atp"; holding: ATPHolding; stakerPower: StakerVotingPower | undefined };

interface DepositToGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: bigint;
  stakingAssetAddress?: Address;
  symbol?: string;
  decimals?: number;
  atpHoldings: ATPHolding[];
  stakerPowers: StakerVotingPower[];
  onSuccess: () => void;
}

export function DepositToGovernanceModal({
  isOpen,
  onClose,
  walletBalance,
  stakingAssetAddress,
  symbol,
  decimals = 18,
  atpHoldings,
  stakerPowers,
  onSuccess,
}: DepositToGovernanceModalProps) {
  const { address: userAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  // Build available sources - wallet first, then ATPs
  const availableSources = useMemo(() => {
    const sources: DepositSource[] = [];

    // Add wallet source if user has balance
    if (walletBalance > 0n) {
      sources.push({ type: "wallet" });
    }

    // Add ATP sources
    for (const holding of atpHoldings) {
      if (holding.stakerAddress) {
        const stakerPower = stakerPowers.find(
          (s) => s.stakerAddress.toLowerCase() === holding.stakerAddress.toLowerCase()
        );
        sources.push({ type: "atp", holding, stakerPower });
      }
    }

    return sources;
  }, [walletBalance, atpHoldings, stakerPowers]);

  const selectedSource = availableSources[selectedSourceIndex] ?? availableSources[0];

  // Fetch token balances for all ATPs
  const atpBalanceContracts = useMemo(() => {
    return atpHoldings
      .filter((h) => h.stakerAddress)
      .map((holding) => ({
        abi: ERC20Abi,
        address: stakingAssetAddress as Address,
        functionName: "balanceOf" as const,
        args: [holding.address as Address],
      }));
  }, [atpHoldings, stakingAssetAddress]);

  const { data: atpBalancesResult, refetch: refetchAtpBalances } = useReadContracts({
    contracts: atpBalanceContracts,
    query: {
      enabled: atpHoldings.length > 0 && !!stakingAssetAddress,
    },
  });

  // Map ATP addresses to their token balances
  const atpBalances = useMemo(() => {
    const map = new Map<string, bigint>();
    const holdingsWithStaker = atpHoldings.filter((h) => h.stakerAddress);
    if (atpBalancesResult) {
      holdingsWithStaker.forEach((holding, idx) => {
        const result = atpBalancesResult[idx]?.result;
        map.set(holding.address.toLowerCase(), typeof result === "bigint" ? result : 0n);
      });
    }
    return map;
  }, [atpHoldings, atpBalancesResult]);

  // Hooks for wallet deposit flow
  const governanceDeposit = useGovernanceDeposit();
  const approveERC20 = useApproveERC20(stakingAssetAddress);
  const { votingPower, refetch: refetchPower } = useUserGovernancePower({ userAddress });
  const { allowance: walletAllowance, refetch: refetchAllowance } = useAllowance({
    tokenAddress: stakingAssetAddress,
    owner: userAddress,
    spender: contracts.governance.address,
  });

  // Get available balance for selected source
  const availableBalance = useMemo(() => {
    if (!selectedSource) return 0n;
    if (selectedSource.type === "wallet") {
      return walletBalance;
    }
    return atpBalances.get(selectedSource.holding.address.toLowerCase()) ?? 0n;
  }, [selectedSource, walletBalance, atpBalances]);

  // Get deposited amount for selected source
  const depositedAmount = useMemo(() => {
    if (!selectedSource) return 0n;
    if (selectedSource.type === "wallet") {
      return votingPower?.directPower ?? 0n;
    }
    return selectedSource.stakerPower?.power ?? 0n;
  }, [selectedSource, votingPower?.directPower]);

  // Hooks for ATP deposit flow
  const selectedAtpAddress =
    selectedSource?.type === "atp" ? (selectedSource.holding.address as Address) : undefined;
  const selectedStakerAddress =
    selectedSource?.type === "atp" ? (selectedSource.holding.stakerAddress as Address) : undefined;

  const approveStaker = useApproveStaker(selectedAtpAddress);
  const atpDeposit = useDepositIntoGovernance(selectedStakerAddress);

  // Check current ATP-to-Staker token allowance (to skip approve if already approved)
  const { allowance: atpStakerAllowance, refetch: refetchAtpAllowance } = useAllowance({
    tokenAddress: stakingAssetAddress,
    owner: selectedAtpAddress,
    spender: selectedStakerAddress,
  });

  // Check if selected staker supports governance functions
  // Uses the ATP's own registry address (fetched from the contract)
  const {
    supportsGovernance,
    isOnLatestVersion,
    upgradeAvailable,
    latestVersion,
    needsOperatorUpdate,
    connectedAddress,
    isLoading: isLoadingGovernanceSupport,
    refetch: refetchGovernanceSupport
  } = useStakerGovernanceSupport({
    stakerAddress: selectedStakerAddress,
    atpAddress: selectedAtpAddress,
    enabled: selectedSource?.type === "atp"
  });

  // Hook for updating staker operator
  const updateStakerOperator = useUpdateStakerOperator(selectedAtpAddress!);

  // Hook for upgrading staker
  const upgradeStaker = useUpgradeStaker(selectedAtpAddress);

  const parsedAmount = parseUnits(amount || "0", decimals);

  // Determine if approval is needed (for wallet deposits to governance contract)
  const needsWalletApproval =
    selectedSource?.type === "wallet" &&
    (walletAllowance ?? 0n) < parsedAmount &&
    parsedAmount > 0n;

  // Determine if ATP-to-Staker approval is needed
  const needsAtpApproval =
    selectedSource?.type === "atp" &&
    (atpStakerAllowance ?? 0n) < parsedAmount &&
    parsedAmount > 0n;

  const canDeposit = parsedAmount > 0n && parsedAmount <= availableBalance;

  // Track previous success states to detect transitions
  const prevSuccessRef = useRef({
    walletDeposit: false,
    walletApprove: false,
    atpDeposit: false,
    atpApprove: false,
  });

  // Store parsed amount for deposit after approval
  const pendingAtpDepositAmount = useRef<bigint>(0n);
  const pendingWalletDepositAmount = useRef<bigint>(0n);

  useEffect(() => {
    const prev = prevSuccessRef.current;

    // Wallet deposit confirmed
    if (governanceDeposit.isSuccess && !prev.walletDeposit) {
      setAmount("");
      refetchPower();
      onSuccess();
      onClose();
    }

    // Wallet approve confirmed - proceed with deposit automatically
    if (approveERC20.isSuccess && !prev.walletApprove) {
      refetchAllowance();
      if (pendingWalletDepositAmount.current > 0n && userAddress) {
        governanceDeposit.deposit(userAddress, pendingWalletDepositAmount.current).catch((error) => {
          const message = error instanceof Error ? error.message : "Deposit failed";
          showAlert("error", message);
        });
      }
    }

    // ATP deposit confirmed
    if (atpDeposit.isSuccess && !prev.atpDeposit) {
      setAmount("");
      refetchPower();
      refetchAtpBalances();
      onSuccess();
      onClose();
    }

    // ATP approve confirmed - refetch allowance and proceed with deposit automatically
    if (approveStaker.isSuccess && !prev.atpApprove && pendingAtpDepositAmount.current > 0n) {
      refetchAtpAllowance();
      atpDeposit.deposit(pendingAtpDepositAmount.current).catch((error) => {
        const message = error instanceof Error ? error.message : "Deposit failed";
        showAlert("error", message);
      });
    }

    prevSuccessRef.current = {
      walletDeposit: governanceDeposit.isSuccess,
      walletApprove: approveERC20.isSuccess,
      atpDeposit: atpDeposit.isSuccess,
      atpApprove: approveStaker.isSuccess,
    };
  }, [
    governanceDeposit.isSuccess,
    approveERC20.isSuccess,
    atpDeposit.isSuccess,
    approveStaker.isSuccess,
    governanceDeposit,
    atpDeposit,
    userAddress,
    onSuccess,
    onClose,
    refetchAllowance,
    refetchAtpAllowance,
    refetchPower,
    refetchAtpBalances,
    showAlert,
  ]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSelectedSourceIndex(0);
      pendingAtpDepositAmount.current = 0n;
      pendingWalletDepositAmount.current = 0n;
      // Sync prevSuccessRef with CURRENT hook states to prevent false transition detection
      // (hooks may still have isSuccess=true from previous transactions)
      prevSuccessRef.current = {
        walletDeposit: governanceDeposit.isSuccess,
        walletApprove: approveERC20.isSuccess,
        atpDeposit: atpDeposit.isSuccess,
        atpApprove: approveStaker.isSuccess,
      };
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, governanceDeposit.isSuccess, approveERC20.isSuccess, atpDeposit.isSuccess, approveStaker.isSuccess]);

  // Refetch governance support after successful staker upgrade
  useEffect(() => {
    if (upgradeStaker.isSuccess) {
      refetchGovernanceSupport();
    }
  }, [upgradeStaker.isSuccess, refetchGovernanceSupport]);

  // Refetch governance support after successful operator update
  useEffect(() => {
    if (updateStakerOperator.isSuccess) {
      refetchGovernanceSupport();
    }
  }, [updateStakerOperator.isSuccess, refetchGovernanceSupport]);

  // Handle wallet deposit (approve first if needed, then deposit)
  const handleWalletAction = async () => {
    if (!userAddress || !stakingAssetAddress) return;
    try {
      if (needsWalletApproval) {
        // Store amount for deposit after approval
        pendingWalletDepositAmount.current = parsedAmount;
        await approveERC20.approve(contracts.governance.address, parsedAmount);
      } else {
        await governanceDeposit.deposit(userAddress, parsedAmount);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      showAlert("error", message);
    }
  };

  // Handle ATP deposit (approve first if needed, then deposit)
  const handleAtpDeposit = async () => {
    if (!selectedAtpAddress) return;
    try {
      if (needsAtpApproval) {
        // Store amount for deposit after approval
        pendingAtpDepositAmount.current = parsedAmount;
        // First approve staker, then deposit will be triggered by useEffect
        await approveStaker.approveStaker(parsedAmount);
      } else {
        // Already approved, deposit directly
        await atpDeposit.deposit(parsedAmount);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      showAlert("error", message);
    }
  };

  // Handle staker upgrade
  const handleUpgradeStaker = async () => {
    if (!selectedAtpAddress || !latestVersion) return;
    try {
      await upgradeStaker.upgradeStaker(latestVersion);
      showAlert("success", "Staker upgraded successfully. You can now deposit to governance.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upgrade failed";
      showAlert("error", message);
    }
  };

  // Handle setting operator (required before depositing to governance)
  const handleSetOperator = async () => {
    if (!selectedAtpAddress || !connectedAddress) return;
    try {
      await updateStakerOperator.updateStakerOperator(connectedAddress);
      showAlert("success", "Operator set successfully. You can now deposit to governance.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set operator";
      showAlert("error", message);
    }
  };

  // Watch for transaction errors
  const prevErrorRef = useRef({
    walletApprove: false,
    walletDeposit: false,
    atpApprove: false,
    atpDeposit: false,
  });

  useEffect(() => {
    const prev = prevErrorRef.current;
    if (approveERC20.isError && !prev.walletApprove && approveERC20.error) {
      showAlert("error", approveERC20.error.message);
    }
    if (governanceDeposit.isError && !prev.walletDeposit && governanceDeposit.error) {
      showAlert("error", governanceDeposit.error.message);
    }
    if (approveStaker.isError && !prev.atpApprove && approveStaker.error) {
      showAlert("error", approveStaker.error.message);
    }
    if (atpDeposit.isError && !prev.atpDeposit && atpDeposit.error) {
      showAlert("error", atpDeposit.error.message);
    }
    prevErrorRef.current = {
      walletApprove: approveERC20.isError,
      walletDeposit: governanceDeposit.isError,
      atpApprove: approveStaker.isError,
      atpDeposit: atpDeposit.isError,
    };
  }, [
    approveERC20.isError,
    approveERC20.error,
    governanceDeposit.isError,
    governanceDeposit.error,
    approveStaker.isError,
    approveStaker.error,
    atpDeposit.isError,
    atpDeposit.error,
    showAlert,
  ]);

  const isPending =
    approveERC20.isPending ||
    governanceDeposit.isPending ||
    approveStaker.isPending ||
    atpDeposit.isPending ||
    upgradeStaker.isPending ||
    updateStakerOperator.isPending;
  const isConfirming =
    approveERC20.isConfirming ||
    governanceDeposit.isConfirming ||
    approveStaker.isConfirming ||
    atpDeposit.isConfirming ||
    upgradeStaker.isConfirming ||
    updateStakerOperator.isConfirming;
  const isReady = !!stakingAssetAddress;

  // Determine if the selected ATP is blocked from governance (version 0)
  // Shows upgrade required message + only upgrade button
  const needsStakerUpgrade = selectedSource?.type === "atp" &&
    !isLoadingGovernanceSupport &&
    !supportsGovernance &&
    upgradeAvailable;

  // Determine if operator needs to be set (required for governance deposits)
  const showOperatorRequired = selectedSource?.type === "atp" &&
    !isLoadingGovernanceSupport &&
    supportsGovernance &&
    needsOperatorUpdate;

  // Determine if we should show upgrade warning (version > 0 but not latest)
  // Shows warning but still allows deposit + offers upgrade option
  const showUpgradeWarning = selectedSource?.type === "atp" &&
    !isLoadingGovernanceSupport &&
    supportsGovernance &&
    !needsOperatorUpdate &&
    !isOnLatestVersion &&
    upgradeAvailable;

  if (!isOpen) return null;

  const isWalletSource = selectedSource?.type === "wallet";

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-ink border border-parchment/20 max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-oracle-standard text-xl text-parchment">Deposit to Governance</h3>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment transition-colors p-2"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <p className="text-sm text-parchment/70 mb-4">
          Deposit tokens to increase your voting power for future proposals.
        </p>

        {/* Source selection dropdown */}
        {availableSources.length > 1 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-parchment/50">Deposit from</label>
              {depositedAmount > 0n && (
                <span className="text-xs text-parchment/40">
                  Already deposited: {formatTokenAmount(depositedAmount, decimals, symbol)}
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedSourceIndex}
                onChange={(e) => {
                  setSelectedSourceIndex(Number(e.target.value));
                  setAmount("");
                }}
                disabled={isPending || isConfirming}
                className="w-full pl-3 pr-10 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableSources.map((source, index) => {
                  const sourceBalance =
                    source.type === "wallet"
                      ? walletBalance
                      : atpBalances.get(source.holding.address.toLowerCase()) ?? 0n;
                  const formattedBalance = formatTokenAmount(sourceBalance, decimals, symbol);
                  return (
                    <option key={index} value={index}>
                      {source.type === "wallet"
                        ? `Wallet (${formattedBalance})`
                        : `Token Vault #${source.holding.sequentialNumber} (${formattedBalance})`}
                    </option>
                  );
                })}
              </select>
              <Icon
                name="chevronDown"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment/60 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Amount input */}
        <div className="mb-4">
          <label className="text-xs text-parchment/50 mb-1 block">Amount to deposit</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              disabled={isPending || isConfirming}
              className="flex-1 px-3 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => setAmount(formatUnits(availableBalance, decimals))}
              disabled={isPending || isConfirming}
              className="px-3 py-2 text-xs border border-parchment/20 text-parchment/70 hover:border-parchment/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {isWalletSource ? (
            <>
              {/* Wallet flow: Single button that approves (if needed) and deposits */}
              <button
                onClick={handleWalletAction}
                disabled={isPending || isConfirming || !canDeposit || !isReady}
                className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {approveERC20.isPending || approveERC20.isConfirming
                  ? "Approving..."
                  : governanceDeposit.isPending || governanceDeposit.isConfirming
                    ? "Depositing..."
                    : !isReady
                      ? "Loading..."
                      : needsWalletApproval
                        ? `Approve ${symbol}`
                        : "Deposit to Governance"}
              </button>
            </>
          ) : (
            <>
              {/* ATP flow */}
              {needsStakerUpgrade ? (
                <>
                  {/* Version 0: Upgrade required - cannot deposit */}
                  <div className="p-3 bg-vermillion/10 border border-vermillion/30 mb-3">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-parchment/80">
                        <p className="font-medium text-vermillion mb-1">Staker Upgrade Required</p>
                        <p>Your current staker version does not support governance deposits. Please upgrade to the latest version to enable this feature.</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgradeStaker}
                    disabled={isPending || isConfirming}
                    className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {upgradeStaker.isPending || upgradeStaker.isConfirming
                      ? "Upgrading..."
                      : `Upgrade to Staker v${latestVersion?.toString()}`}
                  </button>
                </>
              ) : showOperatorRequired ? (
                <>
                  {/* Operator not set: Must set operator before depositing */}
                  <div className="p-3 bg-vermillion/10 border border-vermillion/30 mb-3">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-parchment/80">
                        <p className="font-medium text-vermillion mb-1">Operator Setup Required</p>
                        <p>An operator is an address authorized to perform governance actions on behalf of your Token Vault. The operator will be set to your connected wallet address ({connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : ''}).</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSetOperator}
                    disabled={isPending || isConfirming}
                    className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {updateStakerOperator.isPending || updateStakerOperator.isConfirming
                      ? "Setting Operator..."
                      : "Set Operator"}
                  </button>
                </>
              ) : showUpgradeWarning ? (
                <>
                  {/* Version > 0 but not latest: Warning - can deposit but recommend upgrade */}
                  <div className="p-3 bg-vermillion/10 border border-vermillion/30 mb-3">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-parchment/80">
                        <p className="font-medium text-vermillion mb-1">Staker Upgrade Available</p>
                        <p>It is recommended to upgrade to the latest staker version.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleAtpDeposit}
                      disabled={isPending || isConfirming || !canDeposit || !isReady}
                      className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {approveStaker.isPending || approveStaker.isConfirming
                        ? "Approving..."
                        : atpDeposit.isPending || atpDeposit.isConfirming
                          ? "Depositing..."
                          : "Deposit to Governance"}
                    </button>
                    <button
                      onClick={handleUpgradeStaker}
                      disabled={isPending || isConfirming}
                      className="w-full px-4 py-3 border border-parchment/30 text-parchment font-oracle-standard hover:bg-parchment/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {upgradeStaker.isPending || upgradeStaker.isConfirming
                        ? "Upgrading..."
                        : `Upgrade to Staker v${latestVersion?.toString()}`}
                    </button>
                  </div>
                </>
              ) : !supportsGovernance && !isLoadingGovernanceSupport && selectedSource?.type === "atp" ? (
                <>
                  {/* Governance not supported and no upgrade available */}
                  <div className="p-3 bg-parchment/10 border border-parchment/20">
                    <div className="flex items-start gap-2">
                      <Icon name="info" className="w-4 h-4 text-parchment/60 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-parchment/70">
                        This Token Vault's staker does not support governance deposits. No compatible upgrade is currently available.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal ATP deposit flow - on latest version */}
                  <button
                    onClick={handleAtpDeposit}
                    disabled={isPending || isConfirming || !canDeposit || !isReady || isLoadingGovernanceSupport}
                    className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isLoadingGovernanceSupport
                      ? "Checking compatibility..."
                      : approveStaker.isPending || approveStaker.isConfirming
                        ? "Approving..."
                        : atpDeposit.isPending || atpDeposit.isConfirming
                          ? "Depositing..."
                          : !isReady
                            ? "Loading..."
                            : "Deposit to Governance"}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-3 px-4 py-2 text-parchment/60 hover:text-parchment text-sm"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
