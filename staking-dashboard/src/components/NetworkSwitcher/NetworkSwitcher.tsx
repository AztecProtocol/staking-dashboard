import { useState, useRef, useEffect } from "react"
import { Icon } from "@/components/Icon"
import { cn } from "@/lib/utils"

type Network = "mainnet" | "testnet"

interface NetworkConfig {
  name: string
  label: string
  url: string
}

const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  mainnet: {
    name: "mainnet",
    label: "Mainnet",
    url: import.meta.env.VITE_MAINNET_URL || "https://stake.aztec.network",
  },
  testnet: {
    name: "testnet",
    label: "Testnet",
    url: import.meta.env.VITE_TESTNET_URL || "https://testnet.stake.aztec.network",
  },
}

/**
 * Get the current network from environment variable
 * Defaults to mainnet if not specified
 */
const getCurrentNetwork = (): Network => {
  const envNetwork = import.meta.env.VITE_CURRENT_NETWORK
  if (envNetwork === "testnet" || envNetwork === "mainnet") {
    return envNetwork
  }
  return "mainnet"
}

/**
 * Network switcher dropdown component
 * Allows users to switch between mainnet and testnet versions of the dashboard
 */
export const NetworkSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentNetwork = getCurrentNetwork()
  const currentConfig = NETWORK_CONFIGS[currentNetwork]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const handleNetworkSwitch = (network: Network) => {
    if (network === currentNetwork) {
      setIsOpen(false)
      return
    }

    const targetUrl = NETWORK_CONFIGS[network].url
    window.location.href = targetUrl
  }

  const otherNetworks = Object.entries(NETWORK_CONFIGS).filter(
    ([key]) => key !== currentNetwork
  ) as [Network, NetworkConfig][]

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5",
          "font-oracle-standard text-sm uppercase tracking-wider",
          "text-parchment/80 hover:text-chartreuse transition-colors",
          "border border-parchment/20 hover:border-chartreuse/50",
          "bg-parchment/5 hover:bg-chartreuse/5",
          "focus:outline-none focus:border-chartreuse"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="font-medium">{currentConfig.label}</span>
        <Icon
          name="chevronDown"
          size="sm"
          className={cn(
            "transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 min-w-full z-50",
            "bg-oxblood border border-parchment/20",
            "shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
          role="listbox"
          aria-label="Select network"
        >
          {/* Current network (shown as selected) */}
          <button
            onClick={() => setIsOpen(false)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2",
              "font-oracle-triple-book text-sm text-chartreuse",
              "bg-parchment/10 cursor-default"
            )}
            role="option"
            aria-selected="true"
          >
            <span>{currentConfig.label}</span>
            <Icon name="check" size="sm" className="text-chartreuse" />
          </button>

          {/* Other networks */}
          {otherNetworks.map(([network, config]) => (
            <button
              key={network}
              onClick={() => handleNetworkSwitch(network)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2",
                "font-oracle-triple-book text-sm text-parchment",
                "hover:bg-parchment/10 hover:text-chartreuse",
                "transition-colors"
              )}
              role="option"
              aria-selected="false"
            >
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
