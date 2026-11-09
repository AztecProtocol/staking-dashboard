import { cva } from "class-variance-authority"

/**
 * Buttons as on aztec.network: a 4px corner, uppercase Oracle with wide
 * tracking, lime for the one primary action and glass for the rest. The
 * `btn-*` skins live in index.css so hand-written buttons can share them.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none outline-none disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        // Primary: the lime fill. One per view.
        primary: "btn-lime",

        // Secondary: frosted glass on dark surfaces, outlined paper on light ones
        secondary: "btn-glass",

        // Outline: same quiet button, kept as its own name for existing callers
        outline: "btn-glass",

        // Ghost: no fill until hovered
        ghost: "btn-ghost",

        // Muted: the quiet button, dimmed
        muted: "btn-glass text-parchment/70",

        // Danger/Destructive
        danger: "btn-coral",

        // Neutral accent (Grey 100)
        aqua: "btn-glass",

        // Muted accent (Grey 200)
        orchid: "btn-glass text-parchment/70",

        // Dark/Ink variant
        dark: "btn-ink",

        // Link style
        link:
          "text-accent underline underline-offset-4 hover:opacity-80 p-0 h-auto",
      },
      size: {
        // Small: the compact button that fits inside the navigation pill
        sm: "px-[18px] py-[9px] text-[0.6875rem] min-h-[36px]",

        // Default
        default: "px-6 py-3 text-xs min-h-[44px]",

        // Large
        lg: "px-7 py-3.5 text-[0.8125rem] min-h-[50px]",

        // Extra large
        xl: "px-9 py-4 text-sm min-h-[56px]",

        // Icon only - minimum touch target
        icon: "w-10 h-10 p-0 min-w-[44px] min-h-[44px]",

        // Icon small
        "icon-sm": "w-8 h-8 p-0 min-w-[40px] min-h-[40px]",

        // Icon large
        "icon-lg": "w-12 h-12 p-0 min-w-[48px] min-h-[48px]",
      },
      // Full width variant
      fullWidth: {
        true: "w-full",
        false: "",
      },
      // Corner. The default is the skin's own 4px.
      rounded: {
        default: "",
        md: "rounded-field",
        lg: "rounded-inset",
        xl: "rounded-panel",
        full: "rounded-full",
        none: "rounded-none",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
      rounded: "default",
    },
  }
)
