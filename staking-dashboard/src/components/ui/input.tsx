import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full bg-transparent border-none text-parchment font-md-thermochrome outline-none placeholder-parchment/30 selection:bg-chartreuse selection:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-parchment",
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-1 text-sm file:text-xs",
        default: "h-9 px-3 py-1 text-sm file:text-sm",
        lg: "h-10 px-4 py-2 text-base file:text-sm",
        xl: "p-4 text-base file:text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const containerVariants = cva(
  "bg-parchment/5 border border-parchment/20 focus-within:border-chartreuse focus-within:bg-chartreuse/5 transition-all duration-300",
  {
    variants: {
      size: {
        sm: "",
        default: "",
        lg: "",
        xl: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface InputProps extends Omit<React.ComponentProps<"input">, "size">, VariantProps<typeof inputVariants> {
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, size, type, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ size }), containerClassName)}
        data-slot="input-container"
      >
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={cn(inputVariants({ size }), className)}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
