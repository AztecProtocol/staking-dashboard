import { useState, useRef, useEffect } from "react"
import { StakeFlowSelectedAtpDetails } from "@/components/Stake/StakeFlowSelectedAtpDetails"
import { Icon } from "@/components/Icon"
import { useATPStakingStepsContext } from "@/contexts/ATPStakingStepsContext"
import type { ValidatorRegistrationForm } from "@/types/stakingForm"
import type { RawKeystoreData } from "@/types/keystore"
import { validateKeystoreDataWithReason } from "@/types/keystore"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { RegistrationUploadKeysWarning } from "./RegistrationUploadKeysWarning"
import { RegistrationUploadKeystoreList } from "./RegistrationUploadKeystoreList"
import { RegistrationUploadKeystoreConfirmation } from "./RegistrationUploadKeystoreConfirmation"

/**
 * Component for uploading and validating a single sequencer keystore JSON file
 * The JSON file can contain either a single keystore or an array of keystores
 * Uses ATPStakingStepsContext for all state management
 */
export const RegistrationUploadKeys = () => {
  const { formData, updateFormData, handlePrevStep, handleNextStep, currentStep, setStepValid, canContinue } = useATPStakingStepsContext<ValidatorRegistrationForm>()
  const { selectedAtp, uploadedKeystores, validatorRunningConfirmed, stakeCount } = formData
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Sync internal uploadedFile state with uploadedKeystores prop
  useEffect(() => {
    if (uploadedKeystores?.length > 0 && !uploadedFile) {
      // Set uploadedFile to match the prop when keystores exist but internal state is null
      setUploadedFile(`Uploaded file (${uploadedKeystores.length} keystore${uploadedKeystores.length !== 1 ? 's' : ''})`)
    } else if (!uploadedKeystores?.length && uploadedFile) {
      // Clear uploadedFile when no keystores exist but internal state has a value
      setUploadedFile(null)
    }
  }, [uploadedKeystores, uploadedFile])

  useEffect(() => {
    const maxAllowed = stakeCount!
    if (uploadedKeystores.length > maxAllowed) {
      setUploadError(`Cannot upload ${uploadedKeystores.length} keystores. Maximum allowed is ${maxAllowed}.`)
    }
  }, [stakeCount, uploadedKeystores])

  const processFile = async (file: File) => {
    setIsValidating(true)
    setUploadError(null)
    const allKeystores: RawKeystoreData[] = []

    try {
      // Check file type
      if (!file.name.endsWith('.json') && !file.name.endsWith('.keystore')) {
        throw new Error(`Invalid file type. Only JSON files are accepted.`)
      }

      const content = await readFileAsText(file)

      try {
        const data = JSON.parse(content)

        // Check if it's an array of keystores or a single keystore
        if (Array.isArray(data)) {
          // Validate each keystore in the array
          for (let i = 0; i < data.length; i++) {
            const validation = validateKeystoreDataWithReason(data[i])
            if (!validation.isValid) {
              throw new Error(`Invalid keystore at index ${i}: ${validation.errors.join(', ')}`)
            }
            allKeystores.push(data[i])
          }
        } else {
          // Single keystore
          const validation = validateKeystoreDataWithReason(data)
          if (!validation.isValid) {
            throw new Error(`Invalid keystore format: ${validation.errors.join(', ')}`)
          }
          allKeystores.push(data)
        }
      } catch (parseError) {
        throw new Error(parseError instanceof Error ? parseError.message : 'Invalid JSON format')
      }

      // Validate keystore count doesn't exceed stakeCount
      const maxAllowed = stakeCount 
      if (maxAllowed && allKeystores.length > maxAllowed) {
        throw new Error(`Cannot upload ${allKeystores.length} keystores. Maximum allowed is ${maxAllowed}.`)
      }

      // File processed successfully
      setUploadedFile(`${file.name} (${allKeystores.length} keystore${allKeystores.length !== 1 ? 's' : ''})`)
      updateFormData({ uploadedKeystores: allKeystores })

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file')
      updateFormData({ uploadedKeystores: [] })
      setUploadedFile(null)
    } finally {
      setIsValidating(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          resolve(content)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    // Only set isDragOver to false if we're leaving the entire drop zone
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadError(null)
    updateFormData({ uploadedKeystores: [] })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isStepValid = (uploadedKeystores?.length || 0) > 0 && validatorRunningConfirmed && !uploadError

  // Update step validation
  useEffect(() => {
    setStepValid(currentStep, isStepValid)
  }, [isStepValid, currentStep, setStepValid])

  return (
    <div className="space-y-6">
      {/* Selected ATP Details */}
      <StakeFlowSelectedAtpDetails selectedAtp={selectedAtp} className="mb-6" />

      <div className="text-center mb-6">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics("Upload Sequencer Keys")}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Upload your keystore JSON file containing sequencer credentials and keys.
        </p>
        {(stakeCount) && (
          <p className="text-parchment/60 text-sm mt-2">
            Maximum {stakeCount} keystore{(stakeCount) !== 1 ? 's' : ''} allowed
          </p>
        )}
      </div>

      {/* How to generate sequencer keys */}
      <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="info" size="sm" className="text-parchment/60" />
          <span className="text-xs font-oracle-standard text-parchment/70 uppercase tracking-wide">
            Don't have sequencer keys?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Step 1 */}
          <div className="bg-ink/40 border-l-2 border-aqua/40 p-4 hover:bg-ink/50 hover:border-aqua transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-aqua/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-aqua">1</span>
              </div>
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                Generate Keys
              </span>
            </div>
            <p className="text-xs text-parchment/70 mb-3">
              Generate your validator BLS keys
            </p>
            <a
              href="https://docs.aztec.network/the_aztec_network/setup/sequencer_management#step-2-move-keystore-to-docker-directory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua hover:text-chartreuse text-xs inline-flex items-center gap-1 font-medium cursor-pointer transition-colors"
            >
              View guide
              <Icon name="externalLink" size="sm" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-ink/40 border-l-2 border-aqua/40 p-4 hover:bg-ink/50 hover:border-aqua transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-aqua/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-aqua">2</span>
              </div>
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                Convert to JSON
              </span>
            </div>
            <p className="text-xs text-parchment/70 mb-3">
              Prepare keys for dashboard upload
            </p>
            <a
              href="https://docs.aztec.network/the_aztec_network/setup/sequencer_management#preparing-bls-keys-for-staking-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua hover:text-chartreuse text-xs inline-flex items-center gap-1 font-medium cursor-pointer transition-colors"
            >
              View guide
              <Icon name="externalLink" size="sm" />
            </a>
          </div>
        </div>
      </div>

      {/* Upload area - only show when no file is uploaded */}
      {!uploadedFile && (
        <div
          className={`relative py-12 px-8 text-center transition-all duration-200 cursor-pointer group border-l-4 ${
            isDragOver
              ? 'bg-chartreuse/10 border-l-chartreuse'
              : 'bg-parchment/5 border-l-parchment/30 hover:border-l-chartreuse hover:bg-chartreuse/5'
          }`}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${isDragOver ? 'bg-chartreuse/20' : 'bg-parchment/10 group-hover:bg-chartreuse/15'}`}>
              <svg className={`w-8 h-8 transition-colors duration-200 ${isDragOver ? 'text-chartreuse' : 'text-parchment/60 group-hover:text-chartreuse'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className={`font-oracle-standard font-bold text-sm uppercase tracking-wide transition-colors duration-200 mb-1 ${isDragOver ? 'text-chartreuse' : 'text-parchment group-hover:text-chartreuse'}`}>
                {isValidating ? "Validating keystore..." : isDragOver ? "Drop to upload" : "Upload Keystore"}
              </p>
              <p className="text-xs text-parchment/60 font-arizona-text">
                Drop file or click to browse • JSON only
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded file display - show when file is uploaded */}
      {uploadedFile && (
        <div className="border border-parchment/20 bg-parchment/5 p-4">
          <div className="flex items-center gap-2 text-chartreuse font-medium mb-1">
            <Icon name="check" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">File Uploaded Successfully</span>
          </div>
          <div className="text-sm text-parchment/80 mb-4">
            {uploadedFile}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-parchment/10 text-parchment border-2 border-parchment/30 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
              onClick={handleRemoveFile}
            >
              Remove File
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-parchment/10 text-parchment border-2 border-parchment/30 font-oracle-standard font-bold text-xs uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
              onClick={handleUploadClick}
            >
              Change File
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Warnings */}
      <RegistrationUploadKeysWarning
        uploadError={uploadError}
        uploadedKeystores={uploadedKeystores}
        stakeCount={stakeCount}
      />

      {/* Display sequencer addresses and confirmation */}
      {(uploadedKeystores?.length || 0) > 0 && (
        <div className="bg-parchment/5 border border-parchment/20 p-4 space-y-4">
          {/* Sequencer Addresses */}
          <RegistrationUploadKeystoreList uploadedKeystores={uploadedKeystores!} />

          {/* Sequencer Running Confirmation */}
          <RegistrationUploadKeystoreConfirmation
            uploadedKeystores={uploadedKeystores!}
            validatorRunningConfirmed={validatorRunningConfirmed}
            onConfirmChange={(confirmed) => updateFormData({ validatorRunningConfirmed: confirmed })}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={handlePrevStep}
        >
          Back
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all border-2 ${
            canContinue()
              ? "bg-chartreuse text-ink border-chartreuse hover:bg-parchment hover:text-ink hover:border-parchment shadow-lg"
              : "bg-parchment/10 text-parchment/50 border-parchment/30 cursor-not-allowed"
          }`}
          onClick={handleNextStep}
          disabled={!canContinue()}
        >
          Continue to Token Approval
        </button>
      </div>
    </div>
  )
}