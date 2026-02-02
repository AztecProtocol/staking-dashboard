import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContracts, usePublicClient } from "wagmi";
import { PageHeader } from "@/components/PageHeader";
import { ProposalsList } from "@/components/Governance/ProposalsList";
import { ProposalDetails } from "@/components/Governance/ProposalDetails";
import { DepositToGovernanceModal } from "@/components/Governance/DepositToGovernanceModal";
import { WithdrawFromGovernanceModal } from "@/components/Governance/WithdrawFromGovernanceModal";
import { DelegateVotingPowerModal } from "@/components/Governance/DelegateVotingPowerModal";
import { PendingWithdrawals } from "@/components/Governance/PendingWithdrawals";
import {
  useProposals,
  useTotalPower,
  useMultipleStakerGovernancePower,
  useMultipleUserBallots,
  useTotalPowerAt,
  useUserPowerAt,
  usePendingWithdrawals,
  useDelegationEligibleATPs,
  useDelegatedVotingPower,
  getPendingThrough,
  ProposalState,
  type Proposal,
  type ProposalRaw,
} from "@/hooks/governance";
import { useAtpHoldings } from "@/hooks/atp";
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry";
import { useERC20Balance } from "@/hooks/erc20";
import { contracts } from "@/contracts";
import { ERC20Abi } from "@/contracts/abis/ERC20";
import { PayloadAbi } from "@/contracts/abis/Payload";
import { formatTokenAmount } from "@/utils/atpFormatters";
import { type Address } from "viem";

export default function GovernancePage() {
  const { proposalId: urlProposalId } = useParams<{ proposalId?: string }>();
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { address: userAddress, isConnected } = useAccount();
  const [selectedProposalId, setSelectedProposalId] = useState<bigint | null>(() => {
    if (urlProposalId) {
      try {
        return BigInt(urlProposalId);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);

  // Get proposals
  const { proposals, proposalCount, isLoading, isLoadingMore, hasMore, loadMore, refetch } = useProposals();
  const { totalPower } = useTotalPower();

  // Check if the selected proposal is in the paginated list
  const proposalFromList = useMemo(() => {
    if (selectedProposalId === null) return null;
    return proposals.find((p) => p.id === selectedProposalId) ?? null;
  }, [proposals, selectedProposalId]);

  // Determine if we need to fetch a single proposal (URL has ID not in paginated list)
  const needsFallbackFetch = useMemo(() => {
    if (selectedProposalId === null) return false;
    if (proposalFromList !== null) return false;
    // Only fetch if ID is valid (less than proposalCount)
    if (proposalCount === undefined) return false;
    return selectedProposalId < proposalCount && selectedProposalId >= 0n;
  }, [selectedProposalId, proposalFromList, proposalCount]);

  // Fallback fetch for a single proposal not in paginated list
  const fallbackProposalQuery = useQuery({
    queryKey: ["proposal-fallback", selectedProposalId?.toString()],
    queryFn: async () => {
      if (!publicClient || selectedProposalId === null) return null;

      const rawData = await publicClient.readContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address!,
        functionName: "getProposal",
        args: [selectedProposalId],
      }) as ProposalRaw;

      const currentState = await publicClient.readContract({
        abi: contracts.governance.abi,
        address: contracts.governance.address!,
        functionName: "getProposalState",
        args: [selectedProposalId],
      }) as number;

      let uri: string | undefined;
      try {
        uri = await publicClient.readContract({
          abi: PayloadAbi,
          address: rawData.payload,
          functionName: "getURI",
        }) as string;
        if (!uri || uri.trim() === "") {
          uri = undefined;
        }
      } catch {
        uri = undefined;
      }

      return {
        id: selectedProposalId,
        state: currentState as ProposalState,
        config: rawData.configuration,
        payloadAddress: rawData.payload,
        proposerAddress: rawData.creator,
        creationTimestamp: rawData.creation,
        ballot: rawData.summedBallot,
        uri,
      } as Proposal;
    },
    enabled: needsFallbackFetch && !!publicClient,
    staleTime: 30_000,
  });

  // Use proposal from list if available, otherwise use fallback
  const selectedProposal = proposalFromList ?? fallbackProposalQuery.data ?? null;

  // Get user's ATPs
  const { atpHoldings } = useAtpHoldings();

  // Get delegation-eligible ATPs (auction factory ATPs only)
  const { eligibleATPs: delegationEligibleATPs } = useDelegationEligibleATPs({
    atpHoldings,
    enabled: isConnected,
  });

  // Get staking asset details and user's wallet ERC20 balance
  const { stakingAssetAddress, symbol, decimals } = useStakingAssetTokenDetails();
  const { balance: walletBalance, refetch: refetchBalance } = useERC20Balance(
    stakingAssetAddress!,
    userAddress
  );

  // Get snapshot timestamp for selected proposal (voting power is snapshotted at creation + votingDelay)
  // This is used to query historical power - vaults that didn't exist at snapshot time will have 0 power
  const snapshotTimestamp = selectedProposal
    ? getPendingThrough(selectedProposal.creationTimestamp, selectedProposal.config)
    : undefined;

  // Get user's CURRENT voting power (no timestamp) - used for display in "Your Governance" section
  const { votingPower: currentVotingPower, refetch: refetchCurrentVotingPower } = useMultipleStakerGovernancePower({
    userAddress,
    atpHoldings,
  });

  // Get user's voting power across all ATPs at snapshot time (for voting on selected proposal)
  const { votingPower: snapshotVotingPower, refetch: refetchSnapshotVotingPower } = useMultipleStakerGovernancePower({
    userAddress,
    atpHoldings,
    timestamp: snapshotTimestamp,
  });

  // Use snapshot power for voting calculations, but current power for display
  const votingPower = snapshotVotingPower;

  // Get staker addresses for ballot queries
  const stakerAddresses = useMemo(
    () => atpHoldings.map((h) => h.stakerAddress as Address),
    [atpHoldings]
  );

  // Get ATP addresses for pending withdrawal queries
  // (Withdrawals via Staker have the ATP address as recipient, not the staker address)
  const atpAddresses = useMemo(
    () => atpHoldings.map((h) => h.address as Address),
    [atpHoldings]
  );

  // Get user's ballots for selected proposal (all sources)
  const { ballots, refetch: refetchBallots } = useMultipleUserBallots({
    proposalId: selectedProposal?.id,
    userAddress,
    stakerAddresses,
  });

  // Get total snapshot power for selected proposal
  const { totalPower: snapshotPower } = useTotalPowerAt(snapshotTimestamp);

  // Get user's direct power at the snapshot time (for accurate available voting power)
  const { power: directSnapshotPower, refetch: refetchDirectSnapshotPower } = useUserPowerAt({
    userAddress,
    timestamp: snapshotTimestamp,
  });

  // Get user's delegated voting power (from staked positions delegated to this user)
  const delegatedVotingPower = useDelegatedVotingPower({
    userAddress,
    atpHoldings,
    timestamp: snapshotTimestamp,
    enabled: isConnected && !!selectedProposal,
  });

  // Get pending withdrawals for user and their ATPs
  const { pendingWithdrawals, isLoading: isPendingWithdrawalsLoading, mayHaveOlderWithdrawals, refetch: refetchPendingWithdrawals } = usePendingWithdrawals({
    userAddress,
    atpAddresses,
  });

  // Fetch token balances for all ATPs (available to deposit)
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

  // Map ATP addresses to their available token balances
  const atpAvailableBalances = useMemo(() => {
    const map = new Map<string, bigint>();
    const holdingsWithStaker = atpHoldings.filter((h) => h.stakerAddress);
    if (atpBalancesResult) {
      holdingsWithStaker.forEach((holding, idx) => {
        const result = atpBalancesResult[idx]?.result;
        map.set(holding.stakerAddress.toLowerCase(), typeof result === "bigint" ? result : 0n);
      });
    }
    return map;
  }, [atpHoldings, atpBalancesResult]);

  // Calculate total available to deposit (wallet + all ATPs)
  const totalAvailableToDeposit = useMemo(() => {
    let total = walletBalance;
    for (const balance of atpAvailableBalances.values()) {
      total += balance;
    }
    return total;
  }, [walletBalance, atpAvailableBalances]);

  const handleSelectProposal = useCallback((proposal: Proposal) => {
    setSelectedProposalId(proposal.id);
    navigate(`/governance/${proposal.id}`, { replace: true });
  }, [navigate]);

  const handleVoteSuccess = useCallback(() => {
    refetch();
    fallbackProposalQuery.refetch();
    refetchBalance();
    refetchCurrentVotingPower();
    refetchSnapshotVotingPower();
    refetchBallots();
    refetchDirectSnapshotPower();
    refetchPendingWithdrawals();
    refetchAtpBalances();
  }, [refetch, fallbackProposalQuery, refetchBalance, refetchCurrentVotingPower, refetchSnapshotVotingPower, refetchBallots, refetchDirectSnapshotPower, refetchPendingWithdrawals, refetchAtpBalances]);

  return (
    <>
      <PageHeader
        title={<span className="text-5xl">Governance</span>}
        description={<div className="mt-2">View and vote on governance proposals for the Aztec network.</div>}
      />

      {/* Governance Overview */}
      <div className="mb-6 p-4 border border-parchment/20 bg-parchment/5">
        <div className={`grid gap-6 ${isConnected ? "md:grid-cols-3" : ""}`}>
          {/* Global Stats */}
          <div className="md:col-span-1">
            <h3 className="font-oracle-standard text-sm text-parchment/70 mb-3">
              Governance Stats
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-parchment/50 mb-1">Total Voting Power</p>
                <p className="font-arizona-serif text-3xl">
                  {totalPower ? formatTokenAmount(totalPower, decimals, symbol) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-parchment/50 mb-1">Total Proposals</p>
                <p className="font-arizona-serif text-2xl">
                  {proposalCount?.toString() ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* User's Governance Info */}
          {isConnected && (
            <div className="md:col-span-2 md:border-l md:border-parchment/20 md:pl-6">
              <h3 className="font-oracle-standard text-sm text-parchment/70 mb-3">
                Your Governance
              </h3>
              {/* Top row: Total Voting Power and Total Available */}
              <div className="flex flex-wrap gap-6 items-start mb-3">
                <div>
                  <p className="text-xs text-parchment/50 mb-1">Current Voting Power</p>
                  <div className="flex items-center gap-6">
                    <span className="font-arizona-serif text-3xl pt-[3px]">
                      {currentVotingPower.totalPower > 0n
                        ? formatTokenAmount(currentVotingPower.totalPower, decimals, symbol)
                        : formatTokenAmount(0n, decimals, symbol)}
                    </span>
                    {(currentVotingPower.directPower > 0n || currentVotingPower.stakerPowers.some((s) => s.power > 0n)) && (
                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-2 py-0.5 text-sm border border-parchment/30 text-parchment/70 font-oracle-standard hover:border-parchment/50 hover:text-parchment"
                      >
                        Withdraw
                      </button>
                    )}
                    {delegationEligibleATPs.length > 0 && (
                      <button
                        onClick={() => setIsDelegateModalOpen(true)}
                        className="px-2 py-0.5 text-sm border border-parchment/30 text-parchment/70 font-oracle-standard hover:border-parchment/50 hover:text-parchment"
                      >
                        Delegate
                      </button>
                    )}
                  </div>
                </div>
                {totalAvailableToDeposit > 0n && (
                  <div className="ml-auto">
                    <p className="text-xs text-parchment/50 mb-1">Available to Deposit</p>
                    <div className="flex items-center gap-6">
                      <span className="font-arizona-serif text-3xl pt-[3px]">
                        {formatTokenAmount(totalAvailableToDeposit, decimals, symbol)}
                      </span>
                      <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="px-2 py-0.5 text-sm bg-chartreuse text-ink font-oracle-standard hover:bg-chartreuse/90"
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Breakdown: sources with deposited and available amounts */}
              {(currentVotingPower.stakerPowers.length > 0 || currentVotingPower.directPower > 0n || walletBalance > 0n || atpHoldings.length > 0) && (
                <div className="text-xs text-parchment/50 space-y-1 border-t border-parchment/10 pt-2">
                  {/* Table header */}
                  <div className="flex items-center h-6 opacity-60">
                    <span className="flex-1">Source</span>
                    <span className="w-40 text-right">Deposited</span>
                    <span className="w-40 text-right">Available</span>
                  </div>
                  {/* Wallet row */}
                  <div className="group flex items-center h-6 cursor-default">
                    <span className="flex-1 transition-colors group-hover:text-parchment">Wallet</span>
                    <span className="w-40 text-right transition-colors group-hover:text-parchment">{formatTokenAmount(currentVotingPower.directPower, decimals, symbol)}</span>
                    <span className="w-40 text-right transition-colors group-hover:text-parchment">{formatTokenAmount(walletBalance, decimals, symbol)}</span>
                  </div>
                  {/* ATP/Token Vault rows */}
                  {atpHoldings.filter((h) => h.stakerAddress).map((holding) => {
                    const stakerPower = currentVotingPower.stakerPowers.find(
                      (s) => s.stakerAddress.toLowerCase() === holding.stakerAddress.toLowerCase()
                    );
                    const deposited = stakerPower?.power ?? 0n;
                    const available = atpAvailableBalances.get(holding.stakerAddress.toLowerCase()) ?? 0n;
                    return (
                      <div key={holding.stakerAddress} className="group flex items-center h-6 cursor-default">
                        <span className="flex-1 transition-colors group-hover:text-parchment">Token Vault #{holding.sequentialNumber}</span>
                        <span className="w-40 text-right transition-colors group-hover:text-parchment">{formatTokenAmount(deposited, decimals, symbol)}</span>
                        <span className="w-40 text-right transition-colors group-hover:text-parchment">{formatTokenAmount(available, decimals, symbol)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Pending Withdrawals */}
              <PendingWithdrawals
                userAddress={userAddress}
                pendingWithdrawals={pendingWithdrawals}
                isLoading={isPendingWithdrawalsLoading}
                atpInfoList={atpHoldings.map((h) => ({ address: h.address, sequentialNumber: h.sequentialNumber }))}
                symbol={symbol}
                decimals={decimals}
                mayHaveOlderWithdrawals={mayHaveOlderWithdrawals}
                onSuccess={handleVoteSuccess}
              />
            </div>
          )}
        </div>
      </div>

      {/* Proposals List */}
      <div className="mb-0">
        <h3 className="font-oracle-standard text-sm text-parchment/70 mb-3">
          Proposals
        </h3>
        <ProposalsList
          proposals={proposals}
          selectedProposalId={selectedProposalId}
          onSelectProposal={handleSelectProposal}
          isLoading={isLoading}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      </div>

      {/* Selected Proposal Details */}
      {selectedProposal && (
        <ProposalDetails
          proposal={selectedProposal}
          votingPower={votingPower}
          ballots={ballots}
          snapshotPower={snapshotPower}
          directSnapshotPower={directSnapshotPower}
          currentTotalPower={currentVotingPower.totalPower}
          delegatedVotingPower={delegatedVotingPower}
          onVoteSuccess={handleVoteSuccess}
        />
      )}

      {/* Deposit Modal */}
      <DepositToGovernanceModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        walletBalance={walletBalance}
        stakingAssetAddress={stakingAssetAddress}
        symbol={symbol}
        decimals={decimals}
        atpHoldings={atpHoldings}
        stakerPowers={votingPower.stakerPowers}
        onSuccess={handleVoteSuccess}
      />

      {/* Withdraw Modal */}
      <WithdrawFromGovernanceModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        directDepositBalance={currentVotingPower.directPower}
        stakerPowers={currentVotingPower.stakerPowers}
        symbol={symbol}
        decimals={decimals}
        onSuccess={handleVoteSuccess}
      />

      {/* Delegate Voting Power Modal */}
      <DelegateVotingPowerModal
        isOpen={isDelegateModalOpen}
        onClose={() => setIsDelegateModalOpen(false)}
        eligibleATPs={delegationEligibleATPs}
        onSuccess={handleVoteSuccess}
      />
    </>
  );
}
