import { useRef, useState, useCallback, useLayoutEffect, type MouseEvent } from "react";
import type { Proposal } from "@/hooks/governance";
import { ProposalCard } from "./ProposalCard";

interface ProposalsListProps {
  proposals: Proposal[];
  selectedProposalId: bigint | null;
  onSelectProposal: (proposal: Proposal) => void;
  isLoading: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ProposalsList({
  proposals,
  selectedProposalId,
  onSelectProposal,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ProposalsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollLeft = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Preserve scroll position when proposals change (e.g., after loading more)
  useLayoutEffect(() => {
    if (scrollRef.current && savedScrollLeft.current > 0) {
      scrollRef.current.scrollLeft = savedScrollLeft.current;
    }
  }, [proposals.length]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-0 custom-scrollbar">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 h-32 bg-parchment/5 border border-parchment/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-8 text-center border border-parchment/20 bg-parchment/5">
        <p className="text-parchment/70 font-arizona-text">No proposals found</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`flex gap-4 overflow-x-auto pb-0 custom-scrollbar select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id.toString()}
          proposal={proposal}
          isSelected={selectedProposalId === proposal.id}
          onClick={() => onSelectProposal(proposal)}
        />
      ))}
      {hasMore && onLoadMore && (
        <button
          onClick={() => {
            // Save scroll position before loading more
            if (scrollRef.current) {
              savedScrollLeft.current = scrollRef.current.scrollLeft;
            }
            onLoadMore();
          }}
          disabled={isLoadingMore}
          className="flex-shrink-0 w-48 h-32 border border-parchment/20 bg-parchment/5 hover:bg-parchment/10 hover:border-parchment/30 transition-colors flex items-center justify-center"
        >
          <span className="text-parchment/70 font-oracle-standard">
            {isLoadingMore ? "Loading..." : "Load More"}
          </span>
        </button>
      )}
    </div>
  );
}
