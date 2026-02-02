import type { RawKeystoreData } from "@/types/keystore"

interface RegistrationUploadKeystoreConfirmationProps {
  uploadedKeystores: RawKeystoreData[]
  validatorRunningConfirmed: boolean
  onConfirmChange: (confirmed: boolean) => void
}

/**
 * Checkbox confirmation that sequencers are running and ready
 */
export const RegistrationUploadKeystoreConfirmation = ({
  uploadedKeystores,
  validatorRunningConfirmed,
  onConfirmChange
}: RegistrationUploadKeystoreConfirmationProps) => {
  return (
    <div className="pt-4 border-t border-parchment/20">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 text-chartreuse bg-transparent border-2 border-parchment/30 focus:ring-chartreuse focus:ring-2"
          checked={validatorRunningConfirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
        />
        <div>
          <div className="font-oracle-standard text-sm font-bold text-parchment mb-1 uppercase tracking-wide">
            Sequencer Ready Confirmation
          </div>
          <div className="text-sm text-parchment/80">
            I confirm my {uploadedKeystores.length === 1 ? 'sequencer is' : `${uploadedKeystores.length} sequencers are`} properly configured, running, and ready for consensus participation.
          </div>
        </div>
      </label>
    </div>
  )
}
