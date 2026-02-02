import { StatCard } from "./StatCard"

/**
 * Statistics grid component
 * Displays key metrics in a responsive grid layout
 */
export const StatsGrid = () => {
  const stats = [
    { title: "Total Value Locked", value: "$142.8M", change: "+12.4% (24h)", delay: undefined },
    { title: "Current APR", value: "18.2%", change: "+0.8% (24h)", delay: "100ms" },
    { title: "Total Stakes", value: "8,421", change: "+142 (24h)", delay: "200ms" },
    { title: "Rewards Distributed", value: "2.4M AZTEC", change: "+84.2K (24h)", delay: "300ms" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-20 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  )
};