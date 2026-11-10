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

  // Format the data from API. The number shown is the active stake, so it
  // reflects productive sequencers only.
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

  const activeSequencers = activeStakesCount !== undefined
    ? new Intl.NumberFormat("en-US").format(activeStakesCount)
    : "---";

  const currentAPR = stakingData?.currentAPR
    ? `${stakingData.currentAPR.toFixed(1)}%`
    : "---%";

  const stats = [
    {
      title: "Total Value Staked",
      value: isLoading ? "..." : totalValueStaked,
      tooltip: "Tokens staked with currently active sequencers.",
    },
    {
      title: "Estimated APR",
      value: isLoading ? "..." : currentAPR,
      tooltip: "Estimated yearly return at current reward rates. Actual returns may vary.",
    },
    {
      title: "Active Sequencers",
      value: isLoading ? "..." : activeSequencers,
      tooltip: "Sequencers currently validating on the network.",
    },
    {
      title: "Minimum Stake Required",
      value: isLoadingThreshold ? "..." : formattedThreshold,
      tooltip: "The minimum number of tokens needed for one stake position.",
    },
  ];

  return (
    <section
      data-nav-surface="dark"
      className="on-dark text-paper pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-12 sm:pb-16 md:pb-20 lg:min-h-[660px] lg:flex lg:flex-col lg:justify-center relative overflow-hidden"
    >
      {/* Parallax background: the brand picture, as supplied */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/assets/herd.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center 92%",
          transform: `translateY(${scrollY * 0.5}px)`,
          willChange: "transform",
        }}
      ></div>

      {/* Ink scrim: paper type needs it to read on the picture. It is heavier
          on the left, under the copy, and at the top, under the navigation. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, rgba(20, 25, 0, 0.35) 0%, rgba(20, 25, 0, 0) 22%),
            linear-gradient(90deg, rgba(20, 25, 0, 0.45) 0%, rgba(20, 25, 0, 0.2) 55%, rgba(20, 25, 0, 0.2) 100%)
          `,
        }}
      ></div>

      {/* Below the desktop layout the copy is centred, over the brightest part
          of the picture, so it gets a scrim of its own. */}
      <div
        className="lg:hidden absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 25, 0, 0.5) 0%, rgba(20, 25, 0, 0.42) 45%, rgba(20, 25, 0, 0.15) 100%)",
        }}
      ></div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left: Title and Description */}
          <div className="text-center lg:text-left py-10">
            <h1 className="font-arizona-serif text-[2.75rem] sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-normal leading-none sm:leading-90 tracking-tight-5 mb-4 sm:mb-6 opacity-0 animate-fade-up relative text-parchment">
              Stake $AZTEC
            </h1>
            <p
              className="font-arizona-text text-base sm:text-lg lg:text-xl xl:text-2xl font-light text-parchment/90 opacity-0 animate-fade-up leading-relaxed sm:leading-140"
              style={{ animationDelay: "200ms" }}
            >
              Stake your $AZTEC tokens to earn rewards and power the leading
              platform for unstoppable private apps.
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
                className="glass-picture p-4 sm:p-5 xl:p-6 lg:min-h-[168px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-1 mb-4 sm:mb-5">
                  <div className="eyebrow text-[0.6875rem] sm:text-xs text-parchment/80">
                    {stat.title}
                  </div>
                  <TooltipIcon
                    content={stat.tooltip}
                    size="md"
                    maxWidth="max-w-sm"
                  />
                </div>
                <div
                  className={`font-arizona-serif text-2xl sm:text-3xl lg:text-[1.75rem] xl:text-[2.125rem] font-light leading-none tracking-tight-2 text-parchment ${isLoading ? "animate-pulse" : ""}`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
