import { ProviderInfo } from "@/components/Provider/ProviderInfo";
import { ProviderOverview } from "@/components/Provider/ProviderOverview";
import { ProviderStakingFlow } from "@/components/Provider/ProviderStakingFlow";
import { ProviderSequencerList } from "@/components/Provider/ProviderSequencerList";
import { ProviderDetailSkeleton } from "@/components/Provider/ProviderDetailSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { useProviderDetail } from "@/hooks/providers/useProviderDetail";
import { Link } from "react-router-dom";
import { applyHeroItalics } from "@/utils/typographyUtils";

export default function StakingProviderDetailPage() {
  const { provider, error, isLoading } = useProviderDetail();

  // Show loading skeleton
  if (isLoading) {
    return <ProviderDetailSkeleton />;
  }

  // If provider not found, show error
  if (error || !provider) {
    return (
      <div className="text-center py-12">
        <h3 className="font-md-thermochrome text-2xl text-parchment mb-4">
          Provider Not Found
        </h3>
        <p className="text-parchment/60 mb-6">
          The provider you're looking for doesn't exist.
        </p>
        <Link
          to="/providers"
          className="inline-block bg-chartreuse text-ink px-6 py-2 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-chartreuse/90 transition-all"
        >
          Back to Delegate
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={applyHeroItalics("Selected Provider")}
        description="Stake funds through existing validators"
        backTo="/providers"
        backLabel="Back to Delegate"
        tooltip="Delegate your tokens to this provider. They will handle validator operations while you earn staking rewards. Review their commission rate and performance metrics before proceeding."
      />

      <ProviderOverview provider={provider} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Provider Information & Stakes */}
        <div className="space-y-8">
          <ProviderInfo provider={provider} />
          <ProviderSequencerList stakes={provider.stakes || []} />
        </div>

        {/* Right Column - Stake with Provider */}
        <ProviderStakingFlow
          provider={provider}
        />
      </div>
    </div>
  );
}
