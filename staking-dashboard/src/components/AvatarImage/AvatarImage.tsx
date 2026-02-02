import { useState } from "react"

interface AvatarImageProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Reusable avatar image component with error handling and fallback icon
 */
export const AvatarImage = ({ src, alt, size = 'md', className = '' }: AvatarImageProps) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${className}`}>
        <svg className={`${iconSizes[size]} text-white`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-parchment/10 flex items-center justify-center ${className}`}>
          <div className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} object-cover border border-parchment/20 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 ${className}`}
        loading="lazy"
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}