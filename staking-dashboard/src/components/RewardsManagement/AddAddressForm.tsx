import { useState } from "react"
import { isAddress } from "viem"
import { Icon } from "@/components/Icon"

interface AddAddressFormProps {
  placeholder: string
  onAdd: (address: string) => Promise<void>
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}

/**
 * Reusable form component for adding Ethereum addresses
 */
export const AddAddressForm = ({
  placeholder,
  onAdd,
  isPending,
  isSuccess,
  isError,
  error,
  reset
}: AddAddressFormProps) => {
  const [inputValue, setInputValue] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    reset()

    // Validate address format
    if (!inputValue) {
      setValidationError("Please enter an address")
      return
    }

    if (!isAddress(inputValue)) {
      setValidationError("Invalid Ethereum address format")
      return
    }

    await onAdd(inputValue)

    // Clear input on success
    if (!isError) {
      setInputValue("")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setValidationError(null)
    if (isError) {
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 bg-parchment/5 border border-parchment/20 px-3 py-2 text-sm font-mono text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-chartreuse/50"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !inputValue}
          className="px-4 py-2 bg-chartreuse text-ink font-bold text-sm uppercase tracking-wide hover:bg-chartreuse/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <Icon name="loader" size="sm" className="animate-spin" />
          ) : (
            "Add"
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {(validationError || isError) && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <Icon name="alertCircle" size="sm" />
          <span>{validationError || error?.message || "Failed to add address"}</span>
        </div>
      )}

      {isSuccess && (
        <div className="flex items-center gap-2 text-chartreuse text-xs">
          <Icon name="check" size="sm" />
          <span>Address added successfully</span>
        </div>
      )}
    </form>
  )
}
