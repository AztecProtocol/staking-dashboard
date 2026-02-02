import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  // Base styles - sesuai dengan design system Aztec
  "inline-flex items-center justify-center font-oracle-standard font-bold uppercase tracking-wider transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-chartreuse/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
  {
    variants: {
      variant: {
        // Primary - Connect Wallet style
        primary:
          "bg-chartreuse text-ink border-2 border-chartreuse hover:bg-parchment hover:border-parchment hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Secondary - inverse of primary
        secondary:
          "bg-parchment text-ink border-2 border-parchment hover:bg-chartreuse hover:border-chartreuse hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Outline style - for secondary actions
        outline:
          "bg-transparent text-chartreuse border-2 border-chartreuse hover:bg-chartreuse hover:text-ink shadow-sm hover:shadow-md",

        // Ghost - minimal style
        ghost:
          "bg-transparent text-parchment hover:bg-parchment/10 hover:text-chartreuse",

        // Muted - for less prominent actions
        muted:
          "bg-parchment/10 text-parchment border-2 border-parchment/30 hover:bg-chartreuse/10 hover:border-chartreuse hover:text-chartreuse",

        // Danger/Destructive
        danger:
          "bg-vermillion text-parchment border-2 border-vermillion hover:bg-vermillion/80 hover:border-vermillion/80 hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Aqua accent
        aqua:
          "bg-aqua text-ink border-2 border-aqua hover:bg-aqua/80 hover:border-aqua/80 hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Orchid accent
        orchid:
          "bg-orchid text-parchment border-2 border-orchid hover:bg-orchid/80 hover:border-orchid/80 hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Dark/Ink variant
        dark:
          "bg-ink text-parchment border-2 border-ink hover:bg-ink/90 hover:border-ink/90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl",

        // Link style
        link:
          "text-chartreuse underline-offset-4 hover:underline hover:text-chartreuse/80 p-0 h-auto",
      },
      size: {
        // Small - compact button
        sm: "px-3 sm:px-4 py-2.5 text-xs sm:text-xs min-h-[44px]",

        // Default - standard size (matching Connect Wallet)
        default: "px-4 sm:px-6 py-3 sm:py-3 text-sm sm:text-sm min-h-[44px]",

        // Large - bigger buttons
        lg: "px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-base min-h-[48px]",

        // Extra large - hero buttons
        xl: "px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-lg min-h-[52px]",

        // Icon only - minimum touch target
        icon: "w-10 h-10 sm:w-10 sm:h-10 p-0 min-w-[44px] min-h-[44px]",

        // Icon small
        "icon-sm": "w-8 h-8 sm:w-8 sm:h-8 p-0 min-w-[40px] min-h-[40px]",

        // Icon large
        "icon-lg": "w-12 h-12 sm:w-12 sm:h-12 p-0 min-w-[48px] min-h-[48px]",
      },
      // Full width variant
      fullWidth: {
        true: "w-full",
        false: "",
      },
      // Rounded variants
      rounded: {
        default: "",
        md: "",
        lg: "",
        xl: "",
        full: "",
        none: "",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
      rounded: "none",
    },
  }
)