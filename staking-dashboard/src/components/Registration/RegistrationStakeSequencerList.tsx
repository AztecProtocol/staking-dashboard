import { Icon } from "@/components/Icon"
import { CopyButton } from "@/components/CopyButton/CopyButton"
import { openAddressInExplorer } from "@/utils/explorerUtils"
import { convertRawToValidatorKeys, validateValidatorKeys } from "@/types/keystore"
import type { ValidatorRegistrationForm } from "@/types/stakingForm"

interface RegistrationStakeSequencerListProps {
  uploadedKeystores: ValidatorRegistrationForm['uploadedKeystores']
  completedValidatorsWithQueue: Set<string>
  isLoading: boolean
  isValidatorInQueue: (keystore: ValidatorRegistrationForm['uploadedKeystores'][0]) => boolean
  onAddValidatorToQueue: (index: number) => void
}

/**
 * Displays list of sequencers with individual queue buttons
 */
export const RegistrationStakeSequencerList = ({
  uploadedKeystores,
  completedValidatorsWithQueue,
  isLoading,
  isValidatorInQueue,
  onAddValidatorToQueue
}: RegistrationStakeSequencerListProps) => {
  const numberOfAttesters = uploadedKeystores.length

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-oracle-standard text-parchment/70 uppercase tracking-wide">
          Sequencers ({numberOfAttesters})
        </h3>
      </div>
      <div className="border border-parchment/20 bg-parchment/5 max-h-80 overflow-y-auto">
        {uploadedKeystores.map((keystore, index) => {
          const isCompletedWithQueue = completedValidatorsWithQueue.has(keystore.attester)
          const isValid = validateValidatorKeys(convertRawToValidatorKeys(keystore))
          const isInQueue = isValidatorInQueue(keystore)

          return (
            <div
              key={index}
              className="flex items-center gap-2 p-3 border-b border-parchment/10 last:border-b-0 hover:bg-parchment/10 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-parchment/30 flex items-center justify-center text-xs font-bold text-parchment/60">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div className="text-xs font-mono text-chartreuse truncate pr-2">
                  {keystore.attester}
                </div>
                <div className="flex items-center flex-shrink-0">
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
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isCompletedWithQueue ? (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-oracle-standard font-bold uppercase tracking-wide border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgb(var(--color-chartreuse))',
                      color: 'rgb(var(--color-ink))',
                      borderColor: 'rgb(var(--color-chartreuse))',
                    }}
                    onClick={() => onAddValidatorToQueue(index)}
                    disabled={!isValid || isLoading || isInQueue}
                  >
                    {!isValid
                      ? 'Invalid'
                      : isInQueue
                        ? 'In Batch'
                        : 'Add to Batch'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-oracle-standard font-bold uppercase tracking-wide border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'rgb(var(--color-chartreuse))',
                      borderColor: 'rgb(var(--color-chartreuse))',
                    }}
                    disabled
                  >
                    ✓ Executed
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
