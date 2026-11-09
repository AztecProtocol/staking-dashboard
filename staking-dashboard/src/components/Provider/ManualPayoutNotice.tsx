import { Icon } from "@/components/Icon";

interface ManualPayoutNoticeProps {
  /** URL the operator publishes payout audit reports at. */
  auditUrl: string;
  /** Visual density. `card` for the provider detail banner, `inline`
   *  for the per-row variant used inside claim flows, `badge` for the
   *  table-cell pill. */
  variant?: "card" | "inline" | "badge";
  /** Optional provider name — interpolated into the explanatory copy
   *  when the surface has room for it. Falls back to the generic
   *  "This operator" phrasing when omitted. */
  providerName?: string;
}

/**
 * Surfaces the fact that an operator distributes rewards out of
 * protocol via a manual payout flow (typically the
 * `aztec-staking-payout` tool) instead of the protocol's split
 * contracts. Used wherever the dashboard would otherwise prompt a
 * delegator to claim — provider detail page banner, claim modal
 * row, provider table badge.
 *
 * The audit URL is operator-self-declared and not platform-verified;
 * the copy stays factual rather than endorsing the destination.
 */
export function ManualPayoutNotice({
  auditUrl,
  variant = "card",
  providerName,
}: ManualPayoutNoticeProps) {
  const who = providerName ? providerName : "This operator";

  if (variant === "badge") {
    return (
      <a
        href={auditUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`${who} distributes rewards manually. View audit reports.`}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-oracle-standard uppercase tracking-wider bg-aqua/10 border border-aqua/40 text-aqua hover:bg-aqua/20 transition-colors rounded-btn"
      >
        <Icon name="info" size="sm" />
        Manual payouts
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <div className="text-xs text-parchment/70 flex items-start gap-2">
        <Icon name="info" size="sm" className="text-aqua mt-0.5 shrink-0" />
        <span>
          {who} pays out rewards directly. Verify distributions at{" "}
          <a
            href={auditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aqua hover:underline"
          >
            their audit reports
          </a>
          .
        </span>
      </div>
    );
  }

  return (
    <div className="bg-aqua/5 border border-aqua/30 p-4 sm:p-5 flex items-start gap-3 rounded-inset">
      <Icon name="info" size="md" className="text-aqua mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="font-oracle-standard text-sm text-aqua font-bold uppercase tracking-wider mb-1">
          Manual rewards distribution
        </div>
        <p className="text-sm text-parchment/80 mb-2">
          {who} distributes delegator rewards out of protocol rather
          than via the protocol's split contracts. New rewards arrive
          directly from the operator — track distributions through
          the audit reports below.
        </p>
        <p className="text-xs text-parchment/60 mb-2">
          If you have a delegation with this operator that accrued
          rewards via the split contracts before the switch, the
          per-delegation claim flow still works to sweep what's
          already there.
        </p>
        <a
          href={auditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-aqua hover:underline"
        >
          View payout audit reports
          <Icon name="externalLink" size="sm" />
        </a>
        <p className="text-[11px] text-parchment/40 mt-2">
          Operator-declared. Verify with the published audit reports
          before delegating.
        </p>
      </div>
    </div>
  );
}
