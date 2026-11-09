import { Icon } from "@/components/Icon"
import { LIQUID_STAKING_URL, TOKEN_URL } from "@/config/links"

const WAYS = [
  {
    title: "Liquid Stake",
    body: "Holding less than 200,000 $AZTEC? Stake any amount through liquid staking, with no minimum and no node to run.",
    action: "Stake with Olla",
    href: LIQUID_STAKING_URL,
  },
  {
    title: "Governance",
    body: "Help decide how the network changes. See how governance works and how to take part with your $AZTEC.",
    action: "Participate in governance",
    href: TOKEN_URL,
  },
]

/**
 * Two ways to take part beyond this dashboard: liquid staking for stakes
 * under the minimum, and governance. Sits above the footer on every page.
 */
export const ParticipateLinks = () => {
  return (
    <section aria-labelledby="participate-heading" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
      <h2
        id="participate-heading"
        className="font-arizona-serif font-light text-3xl sm:text-4xl lg:text-5xl leading-none tracking-tight-5 text-parchment mb-8 sm:mb-10"
      >
        More ways to <em className="italic">take part</em>
      </h2>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
        {WAYS.map((way) => (
          <a
            key={way.title}
            href={way.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card-dark group flex flex-col p-7 sm:p-8 min-h-[220px] transition-transform duration-500 hover:-translate-y-1"
          >
            <h3 className="font-arizona-serif font-light text-3xl sm:text-[2.25rem] leading-none tracking-tight-5 text-parchment mb-4">
              {way.title}
            </h3>
            <p className="font-oracle-standard text-base leading-snug text-parchment/80 max-w-md mb-8">
              {way.body}
            </p>
            <span className="eyebrow text-accent mt-auto inline-flex items-center gap-2">
              {way.action}
              <Icon name="arrowRight" size="sm" className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
