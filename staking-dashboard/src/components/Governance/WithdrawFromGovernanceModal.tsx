import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Icon } from "@/components/Icon";
import {
  useGovernanceWithdraw,
  useInitiateWithdrawFromGovernance,
  type StakerVotingPower,
} from "@/hooks/governance";
import { formatTokenAmount } from "@/utils/atpFormatters";
import { useAlert } from "@/contexts/AlertContext";

// Withdraw source can be "wallet" (direct deposit) or an ATP (staker)
type WithdrawSource =
  | { type: "wallet"; depositedAmount: bigint }
  | { type: "atp"; stakerPower: StakerVotingPower };

interface WithdrawFromGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  directDepositBalance: bigint;
  stakerPowers: StakerVotingPower[];
  symbol?: string;
  decimals?: number;
  onSuccess: () => void;
}

export function WithdrawFromGovernanceModal({
  isOpen,
  onClose,
  directDepositBalance,
  stakerPowers,
  symbol,
  decimals = 18,
  onSuccess,
}: WithdrawFromGovernanceModalProps) {
  const { address: userAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  // Build available sources - wallet first (if has deposits), then ATPs with deposits
  const availableSources = useMemo(() => {
    const sources: WithdrawSource[] = [];

    // Add wallet source if user has direct deposits
    if (directDepositBalance > 0n) {
      sources.push({ type: "wallet", depositedAmount: directDepositBalance });
    }

    // Add ATP sources with governance deposits
    for (const stakerPower of stakerPowers) {
      if (stakerPower.power > 0n) {
        sources.push({ type: "atp", stakerPower });
      }
    }

    return sources;
  }, [directDepositBalance, stakerPowers]);

  const selectedSource = availableSources[selectedSourceIndex] ?? availableSources[0];

  // Get deposited amount for selected source
  const depositedBalance = useMemo(() => {
    if (!selectedSource) return 0n;
    if (selectedSource.type === "wallet") {
      return selectedSource.depositedAmount;
    }
    return selectedSource.stakerPower.power;
  }, [selectedSource]);

  // Hooks for withdrawal
  const governanceWithdraw = useGovernanceWithdraw();
  const selectedStakerAddress =
    selectedSource?.type === "atp" ? selectedSource.stakerPower.stakerAddress : undefined;
  const atpWithdraw = useInitiateWithdrawFromGovernance(selectedStakerAddress);

  const parsedAmount = parseUnits(amount || "0", decimals);
  const canWithdraw = parsedAmount > 0n && parsedAmount <= depositedBalance;

  // Track previous success states to detect transitions
  const prevSuccessRef = useRef({
    walletWithdraw: false,
    atpWithdraw: false,
  });

  useEffect(() => {
    const prev = prevSuccessRef.current;

    // Wallet withdrawal initiated successfully
    if (governanceWithdraw.isSuccess && !prev.walletWithdraw) {
      setAmount("");
      onSuccess();
      onClose();
    }

    // ATP withdrawal initiated successfully
    if (atpWithdraw.isSuccess && !prev.atpWithdraw) {
      setAmount("");
      onSuccess();
      onClose();
    }

    prevSuccessRef.current = {
      walletWithdraw: governanceWithdraw.isSuccess,
      atpWithdraw: atpWithdraw.isSuccess,
    };
  }, [governanceWithdraw.isSuccess, atpWithdraw.isSuccess, onSuccess, onClose]);

  // Reset state and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSelectedSourceIndex(0);
      prevSuccessRef.current = {
        walletWithdraw: false,
        atpWithdraw: false,
      };
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!selectedSource) return;

    try {
      if (selectedSource.type === "wallet") {
        if (!userAddress) return;
        await governanceWithdraw.initiateWithdraw(userAddress, parsedAmount);
      } else {
        await atpWithdraw.initiateWithdraw(parsedAmount);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Withdrawal failed";
      showAlert("error", message);
    }
  };

  // Watch for transaction errors from hooks
  const prevErrorRef = useRef({
    walletWithdraw: false,
    atpWithdraw: false,
  });

  useEffect(() => {
    const prev = prevErrorRef.current;
    if (governanceWithdraw.isError && !prev.walletWithdraw && governanceWithdraw.error) {
      showAlert("error", governanceWithdraw.error.message);
    }
    if (atpWithdraw.isError && !prev.atpWithdraw && atpWithdraw.error) {
      showAlert("error", atpWithdraw.error.message);
    }
    prevErrorRef.current = {
      walletWithdraw: governanceWithdraw.isError,
      atpWithdraw: atpWithdraw.isError,
    };
  }, [
    governanceWithdraw.isError,
    governanceWithdraw.error,
    atpWithdraw.isError,
    atpWithdraw.error,
    showAlert,
  ]);

  const isPending = governanceWithdraw.isPending || atpWithdraw.isPending;
  const isConfirming = governanceWithdraw.isConfirming || atpWithdraw.isConfirming;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-ink border border-parchment/20 max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-oracle-standard text-xl text-parchment">Withdraw from Governance</h3>
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
          Initiate a withdrawal of your deposited tokens. After the lock period, you can finalize
          the withdrawal to receive your tokens.
        </p>

        {/* Source selection dropdown */}
        {availableSources.length > 1 && (
          <div className="mb-4">
            <label className="text-xs text-parchment/50 mb-1 block">Withdraw from</label>
            <div className="relative">
              <select
                value={selectedSourceIndex}
                onChange={(e) => {
                  setSelectedSourceIndex(Number(e.target.value));
                  setAmount("");
                }}
                className="w-full pl-3 pr-10 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none cursor-pointer appearance-none"
              >
                {availableSources.map((source, index) => {
                  const sourceBalance =
                    source.type === "wallet"
                      ? source.depositedAmount
                      : source.stakerPower.power;
                  const formattedBalance = formatTokenAmount(sourceBalance, decimals, symbol);
                  return (
                    <option key={index} value={index}>
                      {source.type === "wallet"
                        ? `Wallet Deposits (${formattedBalance})`
                        : `Token Vault #${source.stakerPower.sequentialNumber} (${formattedBalance})`}
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
          <label className="text-xs text-parchment/50 mb-1 block">Amount to withdraw</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none"
            />
            <button
              onClick={() => setAmount(formatUnits(depositedBalance, decimals))}
              className="px-3 py-2 text-xs border border-parchment/20 text-parchment/70 hover:border-parchment/40"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || !canWithdraw}
          className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? "Initiating Withdrawal..." : "Initiate Withdrawal"}
        </button>

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
