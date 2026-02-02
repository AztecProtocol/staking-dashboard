import { Icon } from "@/components/Icon"
import type { RawKeystoreData } from "@/types/keystore"

interface RegistrationUploadKeysWarningProps {
  uploadError: string | null
  uploadedKeystores: RawKeystoreData[] | undefined
  stakeCount?: number
}

/**
 * Displays warnings related to keystore uploads
 * - Upload errors
 * - Insufficient keystores (count less than stakeCount)
 * - Duplicate attester addresses
 */
export const RegistrationUploadKeysWarning = ({
  uploadError,
  uploadedKeystores,
  stakeCount
}: RegistrationUploadKeysWarningProps) => {
  return (
    <>
      {/* Error display */}
      {uploadError && (
        <div className="bg-vermillion/10 border-l-4 border-vermillion p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon name="warning" size="lg" className="text-vermillion" />
            </div>
            <div className="flex-1">
              <div className="font-oracle-standard text-sm font-bold text-vermillion uppercase tracking-wide mb-2">
                Upload Error
              </div>
              <div className="text-sm text-parchment/90">{uploadError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Warning: Insufficient keystores */}
      {uploadedKeystores?.length && stakeCount && uploadedKeystores.length < stakeCount ? (
        <div className="bg-chartreuse/10 border-l-4 border-chartreuse p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon name="info" size="lg" className="text-chartreuse" />
            </div>
            <div className="flex-1">
              <div className="font-oracle-standard text-sm font-bold text-chartreuse uppercase tracking-wide mb-2">
                Keystore Count Notice
              </div>
              <div className="text-sm text-parchment/90 space-y-1">
                <p>You have uploaded {uploadedKeystores.length} keystore{uploadedKeystores.length !== 1 ? 's' : ''}, but your stake count is set to {stakeCount}.</p>
                <p className="text-xs text-parchment/60">You can proceed, but only the uploaded keystores will be staked.</p>
              </div>
            </div>
          </div>
        </div>
      ) : ''}

      {/* Warning: Duplicate attester addresses */}
      {uploadedKeystores && uploadedKeystores.length > 0 && (() => {
        const attesters = uploadedKeystores.map(k => k.attester.toLowerCase())
        const uniqueAttesters = new Set(attesters)
        const hasDuplicates = attesters.length !== uniqueAttesters.size

        if (hasDuplicates) {
          const duplicates = attesters.filter((item, index) => attesters.indexOf(item) !== index)
          const uniqueDuplicates = [...new Set(duplicates)]

          // Count occurrences of each duplicate
          const duplicateCounts = uniqueDuplicates.map(addr => {
            const count = attesters.filter(a => a === addr).length
            return { addr, count }
          })

          return (
            <div className="bg-chartreuse/10 border-l-4 border-chartreuse p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon name="info" size="lg" className="text-chartreuse" />
                </div>
                <div className="flex-1">
                  <div className="font-oracle-standard text-sm font-bold text-chartreuse uppercase tracking-wide mb-2">
                    Duplicate Attester Notice
                  </div>
                  <div className="text-sm text-parchment/90 space-y-2">
                    <p>Your keystore file contains {uniqueDuplicates.length} duplicate attester address{uniqueDuplicates.length !== 1 ? 'es' : ''}. Each sequencer should have a unique address.</p>
                    <div className="font-mono text-xs space-y-1 bg-ink/30 p-2 border border-parchment/10">
                      {duplicateCounts.map(({ addr, count }, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-chartreuse">{uploadedKeystores.find(k => k.attester.toLowerCase() === addr)?.attester}</span>
                          <span className="text-parchment/60">(appears {count} times)</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-parchment/60">You can proceed, but duplicate addresses may cause registration issues.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}
    </>
  )
}
