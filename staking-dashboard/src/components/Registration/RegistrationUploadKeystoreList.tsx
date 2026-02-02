import { useState } from "react"
import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton/CopyButton"
import { openAddressInExplorer } from "@/utils/explorerUtils"
import type { RawKeystoreData } from "@/types/keystore"

interface RegistrationUploadKeystoreListProps {
  uploadedKeystores: RawKeystoreData[]
}

/**
 * Displays an expandable list of sequencer attester addresses
 * Shows first 5 by default, with "Show All" button for more
 */
export const RegistrationUploadKeystoreList = ({
  uploadedKeystores
}: RegistrationUploadKeystoreListProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <div className="text-xs font-oracle-standard text-parchment/60 mb-3 uppercase tracking-wide">
        {uploadedKeystores.length} Sequencer Address{uploadedKeystores.length !== 1 ? 'es' : ''}
      </div>
      <div className="space-y-2 bg-ink/30 border border-parchment/10 p-3">
        {uploadedKeystores.slice(0, isExpanded ? uploadedKeystores.length : 5).map((keystore, index) => (
          <div key={index} className="flex items-center group">
            <div className="text-sm font-mono text-chartreuse break-all pr-2">
              {keystore.attester}
            </div>
            <div className="flex items-center">
              <CopyButton text={keystore.attester} size="sm" />
              <button
                onClick={() => openAddressInExplorer(keystore.attester)}
                className="p-1 text-parchment/60 hover:text-chartreuse transition-colors"
                title="View in explorer"
              >
                <Icon name="externalLink" size="sm" />
              </button>
            </div>
          </div>
        ))}
        {uploadedKeystores.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sm text-aqua hover:text-chartreuse pt-2 border-t border-parchment/10 transition-colors font-oracle-standard uppercase tracking-wide text-xs flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                Show Less
                <Icon name="chevronUp" size="sm" />
              </>
            ) : (
              <>
                Show All ({uploadedKeystores.length - 5} more)
                <Icon name="chevronDown" size="sm" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
