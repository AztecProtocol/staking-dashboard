import { useState, useEffect, useRef, useMemo } from "react";
import { useFinalizeWithdraw, type PendingWithdrawal } from "@/hooks/governance";
import { formatTokenAmount } from "@/utils/atpFormatters";
import { useAlert } from "@/contexts/AlertContext";
import { getExplorerAddressUrl } from "@/utils/explorerUtils";
import { contracts } from "@/contracts";
import type { Address } from "viem";

interface AtpInfo {
  address: string;
  sequentialNumber: number;
}

interface PendingWithdrawalsProps {
  userAddress?: Address;
  pendingWithdrawals: PendingWithdrawal[];
  isLoading: boolean;
  atpInfoList?: AtpInfo[];
  symbol?: string;
  decimals?: number;
  mayHaveOlderWithdrawals?: boolean;
  onSuccess: () => void;
}

export function PendingWithdrawals({
  userAddress,
  pendingWithdrawals,
  isLoading,
  atpInfoList = [],
  symbol,
  decimals = 18,
  mayHaveOlderWithdrawals = false,
  onSuccess,
}: PendingWithdrawalsProps) {

  // Build a map of ATP address -> sequential number for source labeling
  const atpAddressToNumber = useMemo(() => {
    const map = new Map<string, number>();
    for (const atp of atpInfoList) {
      map.set(atp.address.toLowerCase(), atp.sequentialNumber);
    }
    return map;
  }, [atpInfoList]);

  // Determine source label for a withdrawal
  const getSourceLabel = (recipient: Address): string => {
    if (userAddress && recipient.toLowerCase() === userAddress.toLowerCase()) {
      return "Wallet";
    }
    const seqNumber = atpAddressToNumber.get(recipient.toLowerCase());
    if (seqNumber !== undefined) {
      return `Token Vault #${seqNumber}`;
    }
    return "Unknown";
  };
  const finalizeWithdraw = useFinalizeWithdraw();
  const { showAlert } = useAlert();
  const [finalizingId, setFinalizingId] = useState<bigint | null>(null);

  // Track previous success state to detect transitions
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (finalizeWithdraw.isSuccess && !prevSuccessRef.current) {
      setFinalizingId(null);
      onSuccess();
    }
    prevSuccessRef.current = finalizeWithdraw.isSuccess;
  }, [finalizeWithdraw.isSuccess, onSuccess]);

  const handleFinalize = async (withdrawalId: bigint) => {
    setFinalizingId(withdrawalId);
    try {
      await finalizeWithdraw.finalizeWithdraw(withdrawalId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Finalize failed";
      showAlert("error", message);
      setFinalizingId(null);
    }
  };

  // Watch for transaction errors from hook
  const prevErrorRef = useRef(false);
  useEffect(() => {
    if (finalizeWithdraw.isError && !prevErrorRef.current && finalizeWithdraw.error) {
      showAlert("error", finalizeWithdraw.error.message);
      setFinalizingId(null);
    }
    prevErrorRef.current = finalizeWithdraw.isError;
  }, [finalizeWithdraw.isError, finalizeWithdraw.error, showAlert]);

  const formatUnlockTime = (unlocksAt: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now >= unlocksAt) {
      return "Ready";
    }
    const remaining = Number(unlocksAt - now);
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="text-xs text-parchment/50">
        Loading withdrawals...
      </div>
    );
  }

  if (pendingWithdrawals.length === 0 && !mayHaveOlderWithdrawals) {
    return null;
  }

  const governanceExplorerUrl = getExplorerAddressUrl(contracts.governance.address);

  return (
    <div className="mt-3 pt-3 border-t border-parchment/10">
      <p className="text-xs text-parchment/30 mb-2">Pending Withdrawals</p>
      <div className="space-y-2">
        {pendingWithdrawals.map((withdrawal) => (
          <WithdrawalRow
            key={withdrawal.withdrawalId.toString()}
            withdrawal={withdrawal}
            sourceLabel={getSourceLabel(withdrawal.recipient)}
            symbol={symbol}
            decimals={decimals}
            isProcessing={finalizingId === withdrawal.withdrawalId}
            isPending={finalizeWithdraw.isPending || finalizeWithdraw.isConfirming}
            onFinalize={() => handleFinalize(withdrawal.withdrawalId)}
            formatUnlockTime={formatUnlockTime}
          />
        ))}
      </div>
      {mayHaveOlderWithdrawals && (
        <p className="text-xs text-parchment/40 mt-2">
          Only showing withdrawals from the last ~28 days. Older unclaimed withdrawals can be finalized via{" "}
          <a
            href={governanceExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-chartreuse hover:underline"
          >
            Etherscan
          </a>
          .
        </p>
      )}
    </div>
  );
}

interface WithdrawalRowProps {
  withdrawal: PendingWithdrawal;
  sourceLabel: string;
  symbol?: string;
  decimals: number;
  isProcessing: boolean;
  isPending: boolean;
  onFinalize: () => void;
  formatUnlockTime: (unlocksAt: bigint) => string;
}

function WithdrawalRow({
  withdrawal,
  sourceLabel,
  symbol,
  decimals,
  isProcessing,
  isPending,
  onFinalize,
  formatUnlockTime,
}: WithdrawalRowProps) {
  const unlockText = formatUnlockTime(withdrawal.unlocksAt);
  const isReady = withdrawal.canFinalize;

  return (
    <div className="group flex items-center gap-2 text-xs cursor-default">
      <span className="text-parchment/50 min-w-[100px] transition-colors group-hover:text-parchment">{sourceLabel}</span>
      <span className="text-parchment/70 transition-colors group-hover:text-parchment">
        {formatTokenAmount(withdrawal.amount, decimals, symbol)}
      </span>
      {isReady ? (
        <button
          onClick={onFinalize}
          disabled={isProcessing || isPending}
          className="px-2 py-0.5 text-sm bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-50 ml-auto"
        >
          {isProcessing ? "Finalizing..." : "Finalize"}
        </button>
      ) : (
        <span className="text-parchment/40 ml-auto transition-colors group-hover:text-parchment">
          unlocks in {unlockText}
        </span>
      )}
    </div>
  );
}
