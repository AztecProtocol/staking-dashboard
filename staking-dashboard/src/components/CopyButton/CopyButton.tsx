import { useState } from "react"
import { Icon } from "@/components/Icon"

interface CopyButtonProps {
  text: string
  size?: "sm" | "md" | "lg"
  className?: string
  title?: string
}

/**
 * Reusable copy button component with visual feedback
 * Shows checkmark indicator when text is successfully copied
 */
export const CopyButton = ({
  text,
  size = "md",
  className = "",
  title = "Copy to clipboard"
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex-shrink-0 p-1 hover:bg-parchment/10 transition-colors group ${className}`}
      title={title}
    >
      {copied ? (
        <Icon name="check" size={size} className="text-chartreuse" />
      ) : (
        <Icon name="copy" size={size} className="text-parchment/40 group-hover:text-parchment/70" />
      )}
    </button>
  )
}