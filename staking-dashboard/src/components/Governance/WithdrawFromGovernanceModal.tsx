import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Icon } from "@/components/Icon";
import { type StakerVotingPower } from "@/hooks/governance";
import { formatTokenAmount } from "@/utils/atpFormatters";
import { useAlert } from "@/contexts/AlertContext";
import { useTransactionCart } from "@/contexts/TransactionCartContext";
import {
  buildGovernanceInitiateWithdrawEntry,
  buildGovernanceWalletInitiateWithdrawEntry,
} from "@/utils/unstakeCart";

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

/**
 * Modal to queue a governance withdrawal initiation in the cart. Two source
 * variants converge here:
 *
 *   - "wallet" — `Governance.initiateWithdraw(to, amount)` (direct ERC20 deposits)
 *   - "atp"    — `Staker.initiateWithdrawFromGovernance(amount)` (ATP holders)
 *
 * Each is `msg.sender`-bound on contract side, so EOA wallets sign sequentially
 * but Safe wallets batch the whole cart into a single proposal. Cart-routing
 * keeps the user's pending action visible across page reloads via the cart's
 * localStorage persistence.
 */
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
  const { addTransaction, openCart } = useTransactionCart();

  // Build available sources - wallet first (if has deposits), then ATPs with deposits
  const availableSources = useMemo(() => {
    const sources: WithdrawSource[] = [];
    if (directDepositBalance > 0n) {
      sources.push({ type: "wallet", depositedAmount: directDepositBalance });
    }
    for (const stakerPower of stakerPowers) {
      if (stakerPower.power > 0n) {
        sources.push({ type: "atp", stakerPower });
      }
    }
    return sources;
  }, [directDepositBalance, stakerPowers]);

  const selectedSource = availableSources[selectedSourceIndex] ?? availableSources[0];

  const depositedBalance = useMemo(() => {
    if (!selectedSource) return 0n;
    if (selectedSource.type === "wallet") {
      return selectedSource.depositedAmount;
    }
    return selectedSource.stakerPower.power;
  }, [selectedSource]);

  const parsedAmount = parseUnits(amount || "0", decimals);
  const canWithdraw = parsedAmount > 0n && parsedAmount <= depositedBalance;

  // Reset state and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSelectedSourceIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleAddToBatch = () => {
    if (!selectedSource || !canWithdraw) return;

    try {
      if (selectedSource.type === "wallet") {
        if (!userAddress) {
          showAlert("error", "Wallet not connected");
          return;
        }
        addTransaction(
          buildGovernanceWalletInitiateWithdrawEntry({
            to: userAddress,
            amount: parsedAmount,
          }),
          { preventDuplicate: true },
        );
      } else {
        addTransaction(
          buildGovernanceInitiateWithdrawEntry({
            stakerAddress: selectedSource.stakerPower.stakerAddress,
            amount: parsedAmount,
          }),
          { preventDuplicate: true },
        );
      }
      setAmount("");
      onSuccess();
      openCart();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to queue withdrawal";
      showAlert("error", message);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 modal-scrim z-50 flex items-center justify-center p-4">
      <div className="card-dark max-w-md w-full p-6 relative">
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

        <p className="text-sm text-parchment/70 mb-4">
          Queue an initiate-withdraw transaction in the batch cart. After the lock period passes you
          can finalize the withdrawal via the Manage Withdrawals UI to receive your tokens.
        </p>

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
                className="w-full pl-3 pr-10 py-2 field text-parchment cursor-pointer appearance-none"
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

        <div className="mb-4">
          <label className="text-xs text-parchment/50 mb-1 block">Amount to withdraw</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 field text-parchment"
            />
            <button
              onClick={() => setAmount(formatUnits(depositedBalance, decimals))}
              className="px-3 py-2 text-xs border border-parchment/20 text-parchment/70 hover:border-parchment/40 rounded-btn"
            >
              MAX
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToBatch}
          disabled={!canWithdraw}
          className="w-full px-4 py-3 btn-lime disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Add to Batch
        </button>

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
