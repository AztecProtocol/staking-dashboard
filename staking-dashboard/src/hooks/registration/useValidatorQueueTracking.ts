import { useState, useEffect } from "react"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import type { ValidatorRegistrationForm } from "@/types/stakingForm"
import type { RawTransaction } from "@/contexts/TransactionCartContextType"

interface UseValidatorQueueTrackingProps {
  uploadedKeystores: ValidatorRegistrationForm['uploadedKeystores']
  buildValidatorTransaction: (keystore: ValidatorRegistrationForm['uploadedKeystores'][0]) => RawTransaction | null
}

/**
 * Hook for tracking validators that have completed execution through the transaction queue
 */
export function useValidatorQueueTracking({
  uploadedKeystores,
  buildValidatorTransaction
}: UseValidatorQueueTrackingProps) {
  const [completedValidatorsWithQueue, setCompletedValidatorsWithQueue] = useState<Set<string>>(new Set())
  const { getTransactionByTx } = useTransactionCart()

  // Track when queue transactions complete (persist even if tx is deleted from queue)
  useEffect(() => {
    uploadedKeystores.forEach(keystore => {
      const transaction = buildValidatorTransaction(keystore)
      if (transaction) {
        const queuedTransaction = getTransactionByTx(transaction)
        if (queuedTransaction?.status === 'completed' && !completedValidatorsWithQueue.has(keystore.attester)) {
          setCompletedValidatorsWithQueue(prev => new Set(prev).add(keystore.attester))
        }
      }
    })
  }, [uploadedKeystores, buildValidatorTransaction, getTransactionByTx, completedValidatorsWithQueue])

  return {
    completedValidatorsWithQueue
  }
}
