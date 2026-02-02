import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { isAddress, type Address } from "viem";
import { Icon } from "@/components/Icon";
import {
  useDelegateVotingPower,
  type DelegationEligibleATP,
} from "@/hooks/governance";
import { useATPDetails, type DirectStake, type Delegation } from "@/hooks/atp";
import { useStakerGovernanceSupport } from "@/hooks/staker";
import { useUpgradeStaker } from "@/hooks/atp";
import { useRollupData } from "@/hooks/rollup";
import { useAlert } from "@/contexts/AlertContext";
import { formatAddress } from "@/utils/formatAddress";

// Minimum staker version required for delegation (V2+)
// V0 = no governance support
// V1 = governance but delegation broken
// V2+ = full delegation support
const MIN_DELEGATION_VERSION = 2n;

// Unified sequencer type combining direct stakes and delegations
interface Sequencer {
  attesterAddress: Address;
  type: "direct" | "delegation";
  label: string;
}

interface DelegateVotingPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleATPs: DelegationEligibleATP[];
  onSuccess: () => void;
}

export function DelegateVotingPowerModal({
  isOpen,
  onClose,
  eligibleATPs,
  onSuccess,
}: DelegateVotingPowerModalProps) {
  const [selectedAtpIndex, setSelectedAtpIndex] = useState(0);
  const [selectedSequencerIndex, setSelectedSequencerIndex] = useState(0);
  const [delegateeAddress, setDelegateeAddress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  const selectedAtp = eligibleATPs[selectedAtpIndex];
  const selectedAtpAddress = selectedAtp?.holding.address as Address | undefined;
  const selectedStakerAddress = selectedAtp?.holding.stakerAddress as Address | undefined;

  // Get rollup version for delegation call
  const { version: rollupVersion, isLoading: isLoadingRollup } = useRollupData();

  // Check staker governance support (includes version check)
  const {
    currentVersion,
    latestVersion,
    upgradeAvailable,
    needsOperatorUpdate,
    isLoading: isLoadingGovernanceSupport,
    refetch: refetchGovernanceSupport,
  } = useStakerGovernanceSupport({
    stakerAddress: selectedStakerAddress,
    atpAddress: selectedAtpAddress,
    enabled: isOpen && !!selectedAtpAddress,
  });

  // Check if version meets minimum requirement for delegation
  const meetsDelegationVersion = currentVersion !== null && currentVersion >= MIN_DELEGATION_VERSION;

  // Create a safe ATP object for useATPDetails (hook requires atpAddress, but ATPHolding has address)
  // Only create when we have a valid ATP holding to avoid passing invalid data
  const atpForDetails = useMemo(() => {
    if (!selectedAtp?.holding?.address) {
      return null;
    }
    // Convert ATPHolding (address) to minimal ATPData format (atpAddress)
    // Type assertion is safe here because we only access atpAddress in the hook
    return { atpAddress: selectedAtp.holding.address } as { atpAddress: Address };
  }, [selectedAtp?.holding?.address]);

  // Fetch ATP details for sequencer data
  // Only enable when we have valid ATP data and meet all requirements
  const { data: atpDetails, isLoading: isLoadingDetails } = useATPDetails(
    atpForDetails ?? { atpAddress: "" as Address },
    isOpen && !!atpForDetails && meetsDelegationVersion && !needsOperatorUpdate
  );

  // Combine direct stakes and delegations into unified sequencer list
  // Only include sequencers that are actively validating (status === 'SUCCESS')
  // Sequencers still in the entry queue (status === 'PENDING') cannot delegate
  const sequencers = useMemo((): Sequencer[] => {
    if (!atpDetails) return [];

    const result: Sequencer[] = [];

    // Add direct stakes (only validating ones with valid addresses)
    atpDetails.directStakes
      .filter((stake: DirectStake) => stake.status === 'SUCCESS')
      .forEach((stake: DirectStake) => {
        if (!isAddress(stake.attesterAddress)) {
          console.warn(`Invalid attester address for direct stake: ${stake.attesterAddress}`);
          return;
        }
        result.push({
          attesterAddress: stake.attesterAddress,
          type: "direct",
          label: `Direct Stake - ${formatAddress(stake.attesterAddress, 6, 4)}`,
        });
      });

    // Add delegations (only validating ones with valid addresses)
    atpDetails.delegations
      .filter((delegation: Delegation) => delegation.status === 'SUCCESS')
      .forEach((delegation: Delegation) => {
        if (!isAddress(delegation.operatorAddress)) {
          console.warn(`Invalid operator address for delegation: ${delegation.operatorAddress}`);
          return;
        }
        const label = delegation.providerName
          ? `${delegation.providerName} - ${formatAddress(delegation.operatorAddress, 6, 4)}`
          : `Provider - ${formatAddress(delegation.operatorAddress, 6, 4)}`;
        result.push({
          attesterAddress: delegation.operatorAddress,
          type: "delegation",
          label,
        });
      });

    return result;
  }, [atpDetails]);

  const selectedSequencer = sequencers[selectedSequencerIndex];

  // Hooks for delegation and upgrade
  const delegateVotingPower = useDelegateVotingPower(selectedStakerAddress);
  const upgradeStaker = useUpgradeStaker(selectedAtpAddress);

  // Validate delegatee address
  const isValidDelegatee = delegateeAddress.trim() !== "" && isAddress(delegateeAddress);
  const canDelegate =
    isValidDelegatee &&
    selectedSequencer &&
    rollupVersion !== undefined &&
    meetsDelegationVersion &&
    !needsOperatorUpdate;

  // Track previous success states to detect transitions
  const prevSuccessRef = useRef({
    delegate: false,
    upgrade: false,
  });

  useEffect(() => {
    const prev = prevSuccessRef.current;

    // Delegation confirmed
    if (delegateVotingPower.isSuccess && !prev.delegate) {
      showAlert("success", "Voting power delegated successfully!");
      onSuccess();
      onClose();
    }

    // Upgrade confirmed
    if (upgradeStaker.isSuccess && !prev.upgrade) {
      showAlert("success", "Staker upgraded successfully. You can now delegate voting power.");
      refetchGovernanceSupport();
    }

    prevSuccessRef.current = {
      delegate: delegateVotingPower.isSuccess,
      upgrade: upgradeStaker.isSuccess,
    };
  }, [
    delegateVotingPower.isSuccess,
    upgradeStaker.isSuccess,
    onSuccess,
    onClose,
    showAlert,
    refetchGovernanceSupport,
  ]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAtpIndex(0);
      setSelectedSequencerIndex(0);
      setDelegateeAddress("");
      // Sync prevSuccessRef with current hook states
      prevSuccessRef.current = {
        delegate: delegateVotingPower.isSuccess,
        upgrade: upgradeStaker.isSuccess,
      };
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, delegateVotingPower.isSuccess, upgradeStaker.isSuccess]);

  // Reset sequencer selection when ATP changes
  useEffect(() => {
    setSelectedSequencerIndex(0);
  }, [selectedAtpIndex]);

  // Handle delegation
  const handleDelegate = async () => {
    if (!canDelegate || rollupVersion === undefined || !selectedSequencer) return;
    try {
      await delegateVotingPower.delegate(
        rollupVersion,
        selectedSequencer.attesterAddress,
        delegateeAddress as Address
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delegation failed";
      showAlert("error", message);
    }
  };

  // Handle upgrade
  const handleUpgrade = async () => {
    if (!selectedAtpAddress || !latestVersion) return;
    try {
      await upgradeStaker.upgradeStaker(latestVersion);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upgrade failed";
      showAlert("error", message);
    }
  };

  // Watch for transaction errors
  const prevErrorRef = useRef({
    delegate: false,
    upgrade: false,
  });

  useEffect(() => {
    const prev = prevErrorRef.current;
    if (delegateVotingPower.isError && !prev.delegate && delegateVotingPower.error) {
      showAlert("error", delegateVotingPower.error.message);
    }
    if (upgradeStaker.isError && !prev.upgrade && upgradeStaker.error) {
      showAlert("error", upgradeStaker.error.message);
    }
    prevErrorRef.current = {
      delegate: delegateVotingPower.isError,
      upgrade: upgradeStaker.isError,
    };
  }, [
    delegateVotingPower.isError,
    delegateVotingPower.error,
    upgradeStaker.isError,
    upgradeStaker.error,
    showAlert,
  ]);

  const isPending = delegateVotingPower.isPending || upgradeStaker.isPending;
  const isConfirming = delegateVotingPower.isConfirming || upgradeStaker.isConfirming;
  const isLoading = isLoadingGovernanceSupport || isLoadingDetails || isLoadingRollup;

  if (!isOpen) return null;

  // No eligible ATPs
  if (eligibleATPs.length === 0) {
    return createPortal(
      <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-ink border border-parchment/20 max-w-md w-full p-6 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-oracle-standard text-xl text-parchment">Delegate Voting Power</h3>
            <button
              onClick={onClose}
              className="text-parchment/60 hover:text-parchment transition-colors p-2"
              aria-label="Close modal"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 bg-parchment/10 border border-parchment/20">
            <div className="flex items-start gap-3">
              <Icon name="info" className="w-5 h-5 text-parchment/60 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-parchment/70">
                You don't have any Token Vaults eligible for delegation. Only Token Vaults from the auction are eligible to delegate voting power.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-parchment/60 hover:text-parchment text-sm"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // Determine what to show based on version and operator status
  const needsUpgrade = !isLoadingGovernanceSupport && currentVersion !== null && currentVersion < MIN_DELEGATION_VERSION && upgradeAvailable;
  const showOperatorRequired = !isLoadingGovernanceSupport && meetsDelegationVersion && needsOperatorUpdate;
  const showSequencerSelection = meetsDelegationVersion && !needsOperatorUpdate;

  return createPortal(
    <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-ink border border-parchment/20 max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-oracle-standard text-xl text-parchment">Delegate Voting Power</h3>
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
          Delegate your staked voting power to another address. The delegatee will be able to vote on your behalf.
        </p>

        {/* ATP Selection */}
        {eligibleATPs.length > 1 && (
          <div className="mb-4">
            <label className="text-xs text-parchment/50 mb-1 block">Select Token Vault</label>
            <div className="relative">
              <select
                value={selectedAtpIndex}
                onChange={(e) => setSelectedAtpIndex(Number(e.target.value))}
                disabled={isPending || isConfirming}
                className="w-full pl-3 pr-10 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {eligibleATPs.map((atp, index) => (
                  <option key={atp.holding.address} value={index}>
                    Token Vault #{atp.holding.sequentialNumber}
                  </option>
                ))}
              </select>
              <Icon
                name="chevronDown"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment/60 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Content based on version/operator status */}
        {isLoading ? (
          <div className="py-8 text-center text-parchment/50">Loading...</div>
        ) : needsUpgrade ? (
          <>
            {/* Version < 2: Upgrade required */}
            <div className="p-3 bg-vermillion/10 border border-vermillion/30 mb-4">
              <div className="flex items-start gap-2">
                <Icon name="warning" className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" />
                <div className="text-sm text-parchment/80">
                  <p className="font-medium text-vermillion mb-1">Staker Upgrade Required</p>
                  <p>
                    Your current staker version (v{currentVersion?.toString()}) does not support delegation.
                    Please upgrade to version {latestVersion?.toString()} to enable this feature.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
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
            {/* Operator not set */}
            <div className="p-3 bg-vermillion/10 border border-vermillion/30 mb-4">
              <div className="flex items-start gap-2">
                <Icon name="warning" className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" />
                <div className="text-sm text-parchment/80">
                  <p className="font-medium text-vermillion mb-1">Operator Setup Required</p>
                  <p>You need to set an operator for your Token Vault before delegating voting power.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-parchment/50">
              Please set up your operator in the Token Vault details page first.
            </p>
          </>
        ) : showSequencerSelection ? (
          <>
            {/* Sequencer Selection */}
            {sequencers.length === 0 ? (
              <div className="p-4 bg-parchment/10 border border-parchment/20 mb-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" className="w-5 h-5 text-parchment/60 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-parchment/70">
                    This Token Vault has no active validators. Sequencers must be past the entry queue (actively validating) before you can delegate their voting power.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs text-parchment/50 mb-1 block">Select Sequencer</label>
                  <div className="relative">
                    <select
                      value={selectedSequencerIndex}
                      onChange={(e) => setSelectedSequencerIndex(Number(e.target.value))}
                      disabled={isPending || isConfirming}
                      className="w-full pl-3 pr-10 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sequencers.map((seq, index) => (
                        <option key={`${seq.type}-${seq.attesterAddress}`} value={index}>
                          {seq.label}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevronDown"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment/60 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Delegatee Address Input */}
                <div className="mb-4">
                  <label className="text-xs text-parchment/50 mb-1 block">Delegate to address</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={delegateeAddress}
                    onChange={(e) => setDelegateeAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={isPending || isConfirming}
                    className="w-full px-3 py-2 bg-ink border border-parchment/20 text-parchment focus:border-chartreuse outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                  />
                  {delegateeAddress && !isValidDelegatee && (
                    <p className="text-xs text-vermillion mt-1">Please enter a valid Ethereum address</p>
                  )}
                </div>

                {/* Delegate Button */}
                <button
                  onClick={handleDelegate}
                  disabled={isPending || isConfirming || !canDelegate}
                  className="w-full px-4 py-3 bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {delegateVotingPower.isPending || delegateVotingPower.isConfirming
                    ? "Delegating..."
                    : "Delegate Voting Power"}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* No upgrade available and doesn't meet version requirement */}
            <div className="p-4 bg-parchment/10 border border-parchment/20">
              <div className="flex items-start gap-3">
                <Icon name="info" className="w-5 h-5 text-parchment/60 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-parchment/70">
                  This Token Vault's staker does not support delegation. No compatible upgrade is currently available.
                </p>
              </div>
            </div>
          </>
        )}

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
