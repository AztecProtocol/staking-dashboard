import { TooltipIcon } from "@/components/Tooltip";
import { useEffect, useState } from "react";
import { useStakingSummary } from "@/hooks/staking";
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry";
import { useActivationThresholdFormatted } from "@/hooks/rollup/useActivationThresholdFormatted";
import { formatTokenAmount } from "@/utils/atpFormatters";

/**
 * Hero section component for the staking dashboard
 * Displays main title with compact stats layout for better UX
 */
export const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const { data: stakingData, isLoading } = useStakingSummary();
  const { symbol, decimals } = useStakingAssetTokenDetails();
  const { formattedThreshold, isLoading: isLoadingThreshold } =
    useActivationThresholdFormatted();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format the data from API. We show active stake prominently; the
  // exiting/zombie portion is surfaced as a smaller subline so the
  // primary number reflects productive sequencers only.
  const totalStakedFallback = stakingData?.totalValueLocked
    ? BigInt(stakingData.totalValueLocked)
    : undefined;
  const activeStakedRaw =
    stakingData?.activeValueLocked !== undefined
      ? BigInt(stakingData.activeValueLocked)
      : totalStakedFallback;
  const totalValueStaked = activeStakedRaw !== undefined
    ? formatTokenAmount(activeStakedRaw, decimals, symbol)
    : "---";

  const activeStakesCount =
    stakingData?.stats.activeStakes ?? stakingData?.totalStakers;
  const exitingStakesCount = stakingData?.stats.exitingStakes ?? 0;
  const zombieStakesCount = stakingData?.stats.zombieStakes ?? 0;
  const legacyActiveStakesCount = stakingData?.stats.legacyActiveStakes ?? 0;

  const activeSequencers = activeStakesCount !== undefined
    ? new Intl.NumberFormat("en-US").format(activeStakesCount)
    : "---";

  // Subline shown beneath the main numbers when there are any non-active
  // sequencers. Format: "+12 exiting · +4 zombie · +50 on older rollups"
  // — only the non-zero buckets render.
  const buildSequencerSubline = () => {
    const parts: string[] = [];
    if (exitingStakesCount > 0) parts.push(`+${exitingStakesCount} exiting`);
    if (zombieStakesCount > 0) parts.push(`+${zombieStakesCount} zombie`);
    if (legacyActiveStakesCount > 0) parts.push(`+${legacyActiveStakesCount} on older rollups`);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  const buildStakeSubline = () => {
    if (!stakingData) return undefined;
    const totalVL = totalStakedFallback;
    const activeVL = activeStakedRaw;
    if (totalVL === undefined || activeVL === undefined) return undefined;
    const inactiveValue = totalVL - activeVL;
    if (inactiveValue <= 0n) return undefined;
    return `${formatTokenAmount(inactiveValue, decimals, symbol)} ${legacyActiveStakesCount > 0 ? "exiting, zombie or on older rollups" : "exiting or zombie"}`;
  };

  const currentAPR = stakingData?.currentAPR
    ? `${stakingData.currentAPR.toFixed(1)}%`
    : "---%";

  const stats = [
    {
      title: "Total Value Staked",
      value: isLoading ? "..." : totalValueStaked,
      description: "Locked in currently-active sequencers",
      subline: isLoading ? undefined : buildStakeSubline(),
    },
    {
      title: "Estimated APR",
      value: isLoading ? "..." : currentAPR,
      description: "Adjusted for queued attesters",
      subline: undefined,
    },
    {
      title: "Active Sequencers",
      value: isLoading ? "..." : activeSequencers,
      description: "Currently validating on canonical rollup",
      subline: isLoading ? undefined : buildSequencerSubline(),
    },
    {
      title: "Minimum Stake Required",
      value: isLoadingThreshold ? "..." : formattedThreshold,
      description: "Per stake position",
      subline: undefined,
    },
  ];

  return (
    <section className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-24 sm:pb-32 md:pb-40 relative overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
              linear-gradient(180deg, rgba(46, 7, 0, 0.85) 0%, rgba(26, 20, 0, 0.95) 100%),
              url('/assets/Aztec%20Image_15.png')
            `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `translateY(${scrollY * 0.5}px)`,
          willChange: "transform",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left: Title and Description */}
          <div className="text-center lg:text-left py-10">
            <h1 className="font-arizona-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-normal leading-125 sm:leading-90 tracking-tight-5 mb-4 sm:mb-6 opacity-0 animate-fade-up relative text-parchment drop-shadow-lg">
              Stak<em className="italic">ing</em>
            </h1>
            <p
              className="font-arizona-text text-base sm:text-lg lg:text-xl xl:text-2xl font-light text-parchment/90 opacity-0 animate-fade-up leading-relaxed sm:leading-140"
              style={{ animationDelay: "200ms" }}
            >
              Stake your AZTEC tokens to secure the network and earn rewards
              while participating for decentralization.
            </p>
          </div>

          {/* Right: Compact Stats Grid */}
          <div
            className="grid grid-cols-2 gap-4 sm:gap-5 lg:gap-4 opacity-0 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-ink/20 backdrop-blur-lg border border-parchment/20 p-4 sm:p-5 xl:p-6 hover:bg-parchment/10 hover:border-chartreuse/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
                  <div className="font-francesco text-xs sm:text-sm lg:text-xs xl:text-sm uppercase tracking-wider text-chartreuse">
                    {stat.title}
                  </div>
                  <TooltipIcon
                    content={
                      stat.title === "Total Value Staked"
                        ? "Value locked by currently-active sequencers only. Stake from exiting and zombie sequencers, and from sequencers still on an older rollup, is excluded from this number — see the subline for the leftover."
                        : stat.title === "Estimated APR"
                          ? "Estimated annual return based on current rewards and total sequencers (including queued). Actual returns may vary."
                          : stat.title === "Active Sequencers"
                            ? "Currently-validating sequencers on the canonical rollup. Excludes queued, exiting, and zombie (slashed-below-threshold) sequencers — see the subline for those counts."
                            : stat.title === "Minimum Stake Required"
                              ? "The minimum amount of tokens required to create a single stake position"
                              : "Total tokens distributed as rewards to all sequencers."
                    }
                    size="md"
                    maxWidth="max-w-sm"
                  />
                </div>
                <div
                  className={`font-arizona-serif text-xl sm:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold mb-1 text-parchment ${isLoading ? "animate-pulse" : ""}`}
                >
                  {stat.value}
                </div>
                {stat.subline && (
                  <div className="font-mono text-[10px] sm:text-xs text-parchment/50 mb-1">
                    {stat.subline}
                  </div>
                )}
                <div className="font-md-thermochrome text-xs sm:text-sm lg:text-xs xl:text-sm text-aqua">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
