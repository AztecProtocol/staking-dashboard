import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { Icon } from "@/components/Icon"
import { StepIndicator } from "@/components/StepIndicator"
import { SuccessAlert } from "@/components/SuccessAlert"
import { useRollupData } from "@/hooks/rollup/useRollupData"
import { useStakingAssetTokenDetails } from "@/hooks/stakingRegistry/useStakingAssetTokenDetails"
import { useAllowance } from "@/hooks/erc20/useAllowance"
import { useApproveRollup } from "@/hooks/erc20/useApproveRollup"
import { useWalletDirectStake } from "@/hooks/rollup/useWalletDirectStake"
import { useTransactionCart, type WalletDirectStakeMetadata } from "@/contexts/TransactionCartContext"
import { ATPStakingStepsWithTransaction } from "@/contexts/ATPStakingStepsContext"
import { useAlert } from "@/contexts/AlertContext"
import { formatTokenAmount } from "@/utils/atpFormatters"
import { applyHeroItalics } from "@/utils/typographyUtils"
import { getValidatorDashboardQueueUrl } from "@/utils/validatorDashboardUtils"
import { addPendingDirectStake } from "@/utils/pendingDirectStakes"
import { contracts } from "@/contracts"
import { convertRawToValidatorKeys, validateValidatorKeys, validateKeystoreDataWithReason } from "@/types/keystore"
import type { RawKeystoreData } from "@/types/keystore"
import type { Address } from "viem"

const WALLET_DIRECT_STAKING_STEPS_COUNT = 3

interface WalletDirectStakingFlowProps {
  stakeCount: number
  onBack: () => void
  onComplete: () => void
}

/**
 * Wallet direct staking flow component for ERC20 direct staking (own validator registration)
 * Three-step process:
 * 1. Upload validator keys
 * 2. Approve ERC20 tokens for Rollup
 * 3. Register sequencer (call Rollup.deposit())
 */
export const WalletDirectStakingFlow = ({
  stakeCount,
  onBack,
  onComplete,
}: WalletDirectStakingFlowProps) => {
  const { address } = useAccount()
  const { activationThreshold, isLoading: isLoadingRollup } = useRollupData()
  const { stakingAssetAddress, symbol, decimals, isLoading: isLoadingToken } = useStakingAssetTokenDetails()
  const { addTransaction, openCart, transactions, checkTransactionInQueue } = useTransactionCart()
  const { showAlert } = useAlert()

  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [hasCompletedStaking, setHasCompletedStaking] = useState(false)
  const hasTriggeredCompletion = useRef(false)
  const moveWithLatestRollup = true

  // Keystore state
  const [uploadedKeystores, setUploadedKeystores] = useState<RawKeystoreData[]>([])
  const [validatorRunningConfirmed, setValidatorRunningConfirmed] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Unique identifier for this wallet direct staking flow
  const flowIdentifier = useMemo(() => `wallet-direct-${address}`, [address])

  // Calculate total approval amount
  const totalAmount = useMemo(() => {
    if (!activationThreshold) return 0n
    return activationThreshold * BigInt(stakeCount)
  }, [activationThreshold, stakeCount])

  // Check current allowance for Rollup contract
  const { allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useAllowance({
    tokenAddress: stakingAssetAddress,
    owner: address,
    spender: contracts.rollup.address,
  })

  const hasEnoughAllowance = allowance !== undefined && allowance >= totalAmount

  // Hooks for building transactions
  const approveHook = useApproveRollup(stakingAssetAddress)
  const depositHook = useWalletDirectStake()

  // Track transactions in the queue
  const approvalTx = useMemo(() => {
    return transactions.find(tx =>
      tx.type === "wallet-direct-stake" &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.WalletTokenApproval &&
      tx.metadata?.stepGroupIdentifier === flowIdentifier
    )
  }, [transactions, flowIdentifier])

  const depositTxs = useMemo(() => {
    return transactions.filter(tx =>
      tx.type === "wallet-direct-stake" &&
      tx.metadata?.stepType === ATPStakingStepsWithTransaction.WalletDirectStake &&
      tx.metadata?.stepGroupIdentifier === flowIdentifier
    )
  }, [transactions, flowIdentifier])

  const completedDepositsCount = useMemo(() => {
    return depositTxs.filter(tx => tx.status === "completed").length
  }, [depositTxs])

  const isApprovalInQueue = !!approvalTx
  const isApprovalCompleted = approvalTx?.status === "completed"

  // Track completed deposits to add to localStorage for immediate UI display
  const addedPendingStakesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!address || !activationThreshold) return

    // Find newly completed deposits and add them to localStorage
    depositTxs
      .filter(tx => tx.status === "completed")
      .forEach(tx => {
        const metadata = tx.metadata as WalletDirectStakeMetadata
        const attesterAddress = metadata?.attesterAddress
        const txHash = tx.txHash

        // Skip if already added or missing data
        if (!attesterAddress || !txHash || addedPendingStakesRef.current.has(attesterAddress)) {
          return
        }

        // Add to localStorage so it appears in UI immediately
        addPendingDirectStake(address, {
          attesterAddress: attesterAddress as Address,
          withdrawerAddress: address as Address,
          stakedAmount: activationThreshold.toString(),
          txHash,
          timestamp: Math.floor(Date.now() / 1000),
        })

        addedPendingStakesRef.current.add(attesterAddress)
      })
  }, [depositTxs, address, activationThreshold])

  // Track when all deposits complete
  useEffect(() => {
    if (completedDepositsCount > 0 && completedDepositsCount >= uploadedKeystores.length && !hasTriggeredCompletion.current) {
      hasTriggeredCompletion.current = true
      setHasCompletedStaking(true)
      refetchAllowance()
      setShowSuccessAlert(true)
      onComplete()
    }
  }, [completedDepositsCount, uploadedKeystores.length, onComplete, refetchAllowance])

  // Keystore processing
  const processFile = async (file: File) => {
    setIsValidating(true)
    setUploadError(null)
    const allKeystores: RawKeystoreData[] = []

    try {
      if (!file.name.endsWith('.json') && !file.name.endsWith('.keystore')) {
        throw new Error(`Invalid file type. Only JSON files are accepted.`)
      }

      const content = await readFileAsText(file)

      try {
        const data = JSON.parse(content)

        if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            const validation = validateKeystoreDataWithReason(data[i])
            if (!validation.isValid) {
              throw new Error(`Invalid keystore at index ${i}: ${validation.errors.join(', ')}`)
            }
            allKeystores.push(data[i])
          }
        } else {
          const validation = validateKeystoreDataWithReason(data)
          if (!validation.isValid) {
            throw new Error(`Invalid keystore format: ${validation.errors.join(', ')}`)
          }
          allKeystores.push(data)
        }
      } catch (parseError) {
        throw new Error(parseError instanceof Error ? parseError.message : 'Invalid JSON format')
      }

      if (allKeystores.length > stakeCount) {
        throw new Error(`Cannot upload ${allKeystores.length} keystores. Maximum allowed is ${stakeCount}.`)
      }

      setUploadedFile(`${file.name} (${allKeystores.length} keystore${allKeystores.length !== 1 ? 's' : ''})`)
      setUploadedKeystores(allKeystores)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file')
      setUploadedKeystores([])
      setUploadedFile(null)
    } finally {
      setIsValidating(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
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
    setUploadedKeystores([])
    setValidatorRunningConfirmed(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddApprovalToQueue = useCallback(() => {
    if (!stakingAssetAddress || totalAmount <= 0n) return

    const transaction = approveHook.buildRawTx(totalAmount)

    addTransaction({
      type: "wallet-direct-stake",
      label: "Approve Tokens",
      description: `Approve ${formatTokenAmount(totalAmount, decimals, symbol)} for staking`,
      transaction,
      metadata: {
        stepType: ATPStakingStepsWithTransaction.WalletTokenApproval,
        stepGroupIdentifier: flowIdentifier,
        amount: totalAmount,
        stakeCount,
        walletAddress: address,
      }
    }, { preventDuplicate: true })

    setCurrentStep(3)
  }, [stakingAssetAddress, totalAmount, decimals, symbol, flowIdentifier, stakeCount, address, approveHook, addTransaction])

  const handleAddDepositsToQueue = useCallback(() => {
    if (!address || !activationThreshold || uploadedKeystores.length === 0) return

    const areAllValid = uploadedKeystores.every((keystore) =>
      validateValidatorKeys(convertRawToValidatorKeys(keystore))
    )

    if (!areAllValid) {
      showAlert('error', 'Invalid keystores detected')
      return
    }

    let addedCount = 0
    uploadedKeystores.forEach((keystore, index) => {
      const validatorKeys = convertRawToValidatorKeys(keystore)

      const transaction = depositHook.buildRawTx(
        validatorKeys.attester as `0x${string}`,
        address,
        validatorKeys.publicKeyG1,
        validatorKeys.publicKeyG2,
        validatorKeys.proofOfPossession,
        moveWithLatestRollup,
      )

      // Check if already in queue
      if (checkTransactionInQueue(transaction)) return

      addTransaction({
        type: "wallet-direct-stake",
        label: `Stake Sequencer ${uploadedKeystores.length > 1 ? `(${index + 1}/${uploadedKeystores.length})` : ''}`,
        description: `Stake ${validatorKeys.attester.slice(0, 10)}...`,
        transaction,
        metadata: {
          stepType: ATPStakingStepsWithTransaction.WalletDirectStake,
          stepGroupIdentifier: flowIdentifier,
          amount: activationThreshold,
          stakeCount,
          walletAddress: address,
          attesterAddress: validatorKeys.attester as `0x${string}`,
          dependsOn: !hasEnoughAllowance && !isApprovalCompleted ? [{
            stepType: ATPStakingStepsWithTransaction.WalletTokenApproval,
            stepName: "Approve Tokens",
            stepGroupIdentifier: flowIdentifier,
          }] : undefined,
        }
      }, { preventDuplicate: true })

      addedCount++
    })

    if (addedCount > 0) {
      openCart()
    }
  }, [address, activationThreshold, uploadedKeystores, moveWithLatestRollup, depositHook, checkTransactionInQueue, addTransaction, flowIdentifier, stakeCount, hasEnoughAllowance, isApprovalCompleted, openCart, showAlert])

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false)
  }

  const isLoading = isLoadingRollup || isLoadingToken || isLoadingAllowance

  const canProceedToStep2 = uploadedKeystores.length > 0 && validatorRunningConfirmed && !uploadError
  const canProceedToStep3 = hasEnoughAllowance || isApprovalInQueue || isApprovalCompleted

  // Note: Step 1 → 2 requires manual "Continue" click (no auto-advance)
  // Auto-advance to step 3 when approval is complete
  useEffect(() => {
    if ((hasEnoughAllowance || isApprovalCompleted) && currentStep === 2) {
      setCurrentStep(3)
    }
  }, [hasEnoughAllowance, isApprovalCompleted, currentStep])

  // Step 1: Upload Validator Keys
  const renderUploadKeysStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics("Upload Sequencer Keys")}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Upload your keystore JSON file containing sequencer credentials and keys.
        </p>
        <p className="text-parchment/60 text-sm mt-2">
          Maximum {stakeCount} keystore{stakeCount !== 1 ? 's' : ''} allowed
        </p>
      </div>

      {/* How to generate keys info */}
      <div className="bg-parchment/5 border border-parchment/20 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="info" size="sm" className="text-parchment/60" />
          <span className="text-xs font-oracle-standard text-parchment/70 uppercase tracking-wide">
            Don't have sequencer keys?
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-ink/40 border-l-2 border-aqua/40 p-4 hover:bg-ink/50 hover:border-aqua transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-aqua/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-aqua">1</span>
              </div>
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                Generate Keys
              </span>
            </div>
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
          <div className="bg-ink/40 border-l-2 border-aqua/40 p-4 hover:bg-ink/50 hover:border-aqua transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-aqua/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-aqua">2</span>
              </div>
              <span className="text-sm font-oracle-standard font-bold text-parchment uppercase tracking-wide">
                Convert to JSON
              </span>
            </div>
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

      {/* Upload area */}
      {!uploadedFile && (
        <div
          className={`relative py-12 px-8 text-center transition-all duration-200 cursor-pointer group border-l-4 ${
            isDragOver
              ? 'bg-chartreuse/10 border-l-chartreuse'
              : 'bg-parchment/5 border-l-parchment/30 hover:border-l-chartreuse hover:bg-chartreuse/5'
          }`}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
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

      {/* Uploaded file display */}
      {uploadedFile && (
        <div className="border border-parchment/20 bg-parchment/5 p-4">
          <div className="flex items-center gap-2 text-chartreuse font-medium mb-1">
            <Icon name="check" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">File Uploaded Successfully</span>
          </div>
          <div className="text-sm text-parchment/80 mb-4">{uploadedFile}</div>
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

      {/* Upload error */}
      {uploadError && (
        <div className="bg-vermillion/10 border border-vermillion/20 p-3">
          <div className="text-sm font-oracle-standard font-bold text-vermillion uppercase tracking-wide">
            {uploadError}
          </div>
        </div>
      )}

      {/* Sequencer addresses and confirmation */}
      {uploadedKeystores.length > 0 && (
        <div className="bg-parchment/5 border border-parchment/20 p-4 space-y-4">
          <div>
            <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide mb-2">
              Sequencer Addresses ({uploadedKeystores.length})
            </div>
            <div className="space-y-2">
              {uploadedKeystores.map((keystore, index) => (
                <div key={index} className="flex items-center gap-2 py-2 px-3 bg-ink/40 border-l-2 border-chartreuse/40">
                  <span className="text-xs font-mono text-parchment/80">
                    {index + 1}. {keystore.attester}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={validatorRunningConfirmed}
              onChange={(e) => setValidatorRunningConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-chartreuse"
            />
            <span className="text-sm text-parchment/80 group-hover:text-parchment transition-colors">
              I confirm that my sequencer node is running and properly configured with the above keys.
            </span>
          </label>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all border-2 ${
            canProceedToStep2
              ? "bg-chartreuse text-ink border-chartreuse hover:bg-parchment hover:text-ink hover:border-parchment shadow-lg"
              : "bg-parchment/10 text-parchment/50 border-parchment/30 cursor-not-allowed"
          }`}
          onClick={() => setCurrentStep(2)}
          disabled={!canProceedToStep2}
        >
          Continue to Token Approval
        </button>
      </div>
    </div>
  )

  // Step 2: Token Approval
  const renderApprovalStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
          {applyHeroItalics("Approve Token Spending")}
        </h2>
        <p className="text-parchment/70 max-w-lg mx-auto">
          Allow the rollup contract to spend your tokens for staking.
        </p>
      </div>

      {/* Approval Amount Display */}
      <div className="bg-parchment/5 border border-parchment/20 p-6">
        {isLoading ? (
          <div className="text-center text-parchment/60">Loading approval details...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Amount to Approve</div>
              <div className="text-2xl font-mono font-bold text-chartreuse">
                {formatTokenAmount(totalAmount, decimals, symbol)}
              </div>
              <div className="text-sm text-parchment/50 mt-1">
                {uploadedKeystores.length} sequencer{uploadedKeystores.length !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
              </div>
            </div>

            {allowance !== undefined && (
              <div className="pt-4 border-t border-parchment/20">
                <div className="text-xs font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Current Allowance</div>
                <div className={`text-lg font-mono font-bold ${hasEnoughAllowance ? 'text-chartreuse' : 'text-parchment/70'}`}>
                  {formatTokenAmount(allowance, decimals, symbol)}
                  {hasEnoughAllowance && <span className="ml-2 text-sm">✓</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasEnoughAllowance && (
        <div className="bg-chartreuse/10 border border-chartreuse/20 p-4">
          <div className="flex items-center gap-2 text-chartreuse font-medium mb-1">
            <Icon name="check" size="lg" />
            <span className="font-oracle-standard text-sm uppercase tracking-wide">Tokens Already Approved</span>
          </div>
          <div className="text-sm text-parchment/80">
            You have sufficient allowance. Proceed to registration.
          </div>
        </div>
      )}

      {!hasEnoughAllowance && (
        <button
          type="button"
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddApprovalToQueue}
          disabled={isLoading || isApprovalInQueue}
        >
          {isApprovalInQueue ? "In Batch" : "Add to Batch"}
        </button>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
          onClick={() => setCurrentStep(1)}
        >
          Back
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider transition-all border-2 ${
            canProceedToStep3
              ? "bg-chartreuse text-ink border-chartreuse hover:bg-parchment hover:text-ink hover:border-parchment shadow-lg"
              : "bg-parchment/10 text-parchment/50 border-parchment/30 cursor-not-allowed"
          }`}
          onClick={() => setCurrentStep(3)}
          disabled={!canProceedToStep3}
        >
          Continue
        </button>
      </div>
    </div>
  )

  // Step 3: Stake Sequencers
  const renderStakeStep = () => {
    const allInQueue = depositTxs.length >= uploadedKeystores.length

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="font-arizona-serif text-2xl font-medium mb-3 text-parchment">
            {applyHeroItalics("Stake Sequencers")}
          </h2>
          <p className="text-parchment/70 max-w-lg mx-auto">
            Complete your sequencer registration by staking your keys on the network.
          </p>
        </div>

        {/* Stake summary */}
        <div className="bg-parchment/5 border border-parchment/20 p-6">
          {isLoading ? (
            <div className="text-center text-parchment/60">Loading stake details...</div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-chartreuse mb-2">
                  {formatTokenAmount(totalAmount, decimals, symbol)}
                </div>
                <div className="text-sm font-oracle-standard text-parchment/60 mb-2 uppercase tracking-wide">Total Stake Amount</div>
                <div className="text-sm text-parchment/50 mb-4">
                  {uploadedKeystores.length} sequencer{uploadedKeystores.length !== 1 ? 's' : ''} × {activationThreshold ? formatTokenAmount(activationThreshold, decimals, symbol) : '...'}
                </div>
              </div>

              <div className="border-t border-parchment/20 pt-4 space-y-3">
                <div className="text-xs font-oracle-standard text-parchment/60 uppercase tracking-wide">Registering:</div>
                <div className="space-y-2">
                  {uploadedKeystores.map((keystore, index) => {
                    const isInQueue = depositTxs.some(tx =>
                      (tx.metadata as WalletDirectStakeMetadata)?.attesterAddress === keystore.attester
                    )
                    const isCompleted = depositTxs.some(tx =>
                      (tx.metadata as WalletDirectStakeMetadata)?.attesterAddress === keystore.attester &&
                      tx.status === "completed"
                    )

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between py-2 px-3 ${
                          isCompleted
                            ? 'bg-chartreuse/10 border-l-2 border-chartreuse'
                            : isInQueue
                              ? 'bg-aqua/10 border-l-2 border-aqua'
                              : 'bg-parchment/5'
                        }`}
                      >
                        <span className="text-xs font-mono text-parchment/80">
                          {keystore.attester.slice(0, 10)}...{keystore.attester.slice(-8)}
                        </span>
                        {isCompleted && (
                          <span className="text-xs font-oracle-standard text-chartreuse uppercase">Registered</span>
                        )}
                        {isInQueue && !isCompleted && (
                          <span className="text-xs font-oracle-standard text-aqua uppercase">In Queue</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Success display */}
        {hasCompletedStaking && (
          <div className="bg-chartreuse/10 border border-chartreuse/20 p-4 text-center">
            <div className="text-sm font-oracle-standard font-bold text-chartreuse mb-2 uppercase tracking-wide">
              Staking Request Successful
            </div>
            <div className="text-sm text-parchment/60">
              {uploadedKeystores.length > 1
                ? `All ${uploadedKeystores.length} sequencers have been added to the activation queue.`
                : 'Your sequencer has been added to the activation queue.'
              }
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <button
          type="button"
          className="w-full bg-chartreuse text-ink py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment hover:text-ink transition-all duration-300 border-2 border-chartreuse hover:border-parchment shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddDepositsToQueue}
          disabled={isLoading || !address || hasCompletedStaking || allInQueue}
        >
          {!address
            ? "Connect Wallet"
            : allInQueue
              ? "In Batch"
              : hasCompletedStaking
                ? "Registered Successfully"
                : "Add to Batch"}
        </button>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 bg-parchment/10 text-parchment border-2 border-parchment/30 py-3 font-oracle-standard font-bold text-sm uppercase tracking-wider hover:bg-parchment/20 hover:border-parchment/50 transition-all"
            onClick={() => setCurrentStep(2)}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SuccessAlert
        isOpen={showSuccessAlert}
        title="Staking Request Successful"
        message={
          <>
            Your sequencer{uploadedKeystores.length > 1 ? 's have' : ' has'} been added to the activation queue. Check the{" "}
            <a
              href={getValidatorDashboardQueueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-chartreuse underline hover:text-chartreuse/80 font-bold"
            >
              queue
            </a>{" "}
            to monitor activation status.
          </>
        }
        onClose={handleCloseSuccessAlert}
      />

      {/* Step Indicator */}
      <div className="pb-4 border-b border-parchment/10 overflow-hidden">
        <div className="w-full max-w-full">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={WALLET_DIRECT_STAKING_STEPS_COUNT}
            className="mb-2"
          />
        </div>
        <p className="text-center text-parchment/60 text-sm mt-3">
          Step {currentStep} of {WALLET_DIRECT_STAKING_STEPS_COUNT}
        </p>
      </div>

      {/* Step Content */}
      <div className="space-y-8">
        {currentStep === 1 && renderUploadKeysStep()}
        {currentStep === 2 && renderApprovalStep()}
        {currentStep === 3 && renderStakeStep()}
      </div>
    </div>
  )
}
