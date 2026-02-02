import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CustomSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface CustomSelectProps {
  value?: string
  placeholder?: string
  options: CustomSelectOption[]
  onChange?: (value: string) => void
  disabled?: boolean
  size?: "sm" | "default" | "lg" | "xl"
  className?: string
  error?: string
}

/**
 * Custom select component matching the Aztec design system
 * Built on top of Radix UI Select with consistent styling
 */
export const CustomSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  CustomSelectProps
>(({
  value,
  placeholder = "Select an option...",
  options,
  onChange,
  disabled = false,
  size = "default",
  className,
  error,
  ...props
}, ref) => {
  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          ref={ref}
          size={size}
          className={error ? "border-vermillion focus-within:border-vermillion" : ""}
          {...props}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              <div className="flex flex-col">
                <span className="text-parchment">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-parchment/60 mt-1">
                    {option.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-2 text-sm text-vermillion font-oracle-standard">
          {error}
        </p>
      )}
    </div>
  )
})

CustomSelect.displayName = "CustomSelect"