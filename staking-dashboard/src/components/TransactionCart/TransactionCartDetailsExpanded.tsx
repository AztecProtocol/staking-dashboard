import type { CartTransaction } from "@/contexts/TransactionCartContext"
import { ClaimStepTypeName, UnstakeStepTypeName, ActionStepTypeName } from "@/contexts/TransactionCartContext"
import { CopyButton } from "@/components/CopyButton/CopyButton"
import { Icon } from "@/components/Icon"
import { openTxInExplorer } from "@/utils/explorerUtils"

interface TransactionCartDetailsExpandedProps {
  transaction: CartTransaction
}

/**
 * Displays detailed information about a transaction in the cart
 * Shows transaction data, metadata, and raw transaction details
 */
export const TransactionCartDetailsExpanded = ({ transaction }: TransactionCartDetailsExpandedProps) => {
  return (
    <div className="px-3 sm:px-4 py-3 bg-parchment/5 border-t border-parchment/10 space-y-3 text-xs">
      {/* Status */}
      {transaction.status && (
        <div>
          <div className="text-[10px] font-oracle-standard uppercase tracking-wide text-parchment/60 mb-2">
            Status
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 border rounded-btn text-[10px] font-oracle-standard uppercase tracking-wide ${
                transaction.status === 'completed' ? 'bg-parchment/5 border-parchment/20 text-accent' :
                transaction.status === 'failed' ? 'bg-vermillion/10 border-vermillion/30 text-vermillion' :
                transaction.status === 'executing' ? 'bg-aqua/10 border-aqua/30 text-aqua' :
                'bg-parchment/10 border-parchment/30 text-parchment/60'
              }`}>
                {transaction.status}
              </div>
            </div>
            {transaction.txHash && (
              <div>
                <div className="text-[10px] text-parchment/50 mb-1">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-accent break-all">
                    {transaction.txHash}
                  </code>
                  <CopyButton text={transaction.txHash} size="sm" />
                  <button
                    onClick={() => openTxInExplorer(transaction.txHash!)}
                    className="p-1 text-parchment/60 hover:text-accent transition-colors"
                    title="View on explorer"
                  >
                    <Icon name="externalLink" size="sm" />
                  </button>
                </div>
              </div>
            )}
            {transaction.error && (
              <div>
                <div className="text-[10px] text-parchment/50 mb-1">Error</div>
                <div className="text-[10px] text-vermillion break-all">
                  {transaction.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Data */}
      <div>
        <div className="text-[10px] font-oracle-standard uppercase tracking-wide text-parchment/60 mb-2">
          Transaction Data
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-parchment/50 mb-1">To Address</div>
            <div className="flex items-center gap-2">
              <code className="text-[10px] font-mono text-accent break-all">
                {transaction.transaction.to}
              </code>
              <CopyButton text={transaction.transaction.to} size="sm" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-parchment/50 mb-1">Value</div>
            <code className="text-[10px] font-mono text-parchment">
              {transaction.transaction.value.toString()} wei
            </code>
          </div>
          <div>
            <div className="text-[10px] text-parchment/50 mb-1">Data</div>
            <div className="flex items-center gap-2">
              <code className="text-[10px] font-mono text-parchment break-all max-w-full">
                {transaction.transaction.data.slice(0, 66)}...
              </code>
              <CopyButton text={transaction.transaction.data} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {transaction.metadata && (
        <div>
          <div className="text-[10px] font-oracle-standard uppercase tracking-wide text-parchment/60 mb-2">
            Metadata
          </div>
          <div className="space-y-2">
            {transaction.type === "delegation" && "providerId" in transaction.metadata && (
              <>
                <div>
                  <div className="text-[10px] text-parchment/50 mb-1">Provider ID</div>
                  <code className="text-[10px] font-mono text-parchment">
                    {transaction.metadata.providerId}
                  </code>
                </div>
                <div>
                  <div className="text-[10px] text-parchment/50 mb-1">Provider Name</div>
                  <code className="text-[10px] font-mono text-parchment">
                    {transaction.metadata.providerName}
                  </code>
                </div>
                {transaction.metadata.atpAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Token Vault Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.atpAddress}
                      </code>
                      <CopyButton text={transaction.metadata.atpAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.amount && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Amount</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.amount.toString()}
                    </code>
                  </div>
                )}
              </>
            )}
            {transaction.type === "claim" && (
              <>
                {transaction.metadata.stepType && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Step</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {ClaimStepTypeName[transaction.metadata.stepType]}
                    </code>
                  </div>
                )}
                {transaction.metadata.coinbase && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Coinbase Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.coinbase}
                      </code>
                      <CopyButton text={transaction.metadata.coinbase} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.splitContract && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Split Contract</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.splitContract}
                      </code>
                      <CopyButton text={transaction.metadata.splitContract} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.rollupAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">
                      Rollup{transaction.metadata.rollupVersion ? ` v${transaction.metadata.rollupVersion}` : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.rollupAddress}
                      </code>
                      <CopyButton text={transaction.metadata.rollupAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.amount !== undefined && transaction.metadata.amount > 0n && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Expected Amount</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.amount.toString()}
                    </code>
                  </div>
                )}
              </>
            )}
            {transaction.type === "unstake" && (
              <>
                {transaction.metadata.stepType && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Step</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {UnstakeStepTypeName[transaction.metadata.stepType]}
                    </code>
                  </div>
                )}
                {transaction.metadata.attesterAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Attester</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.attesterAddress}
                      </code>
                      <CopyButton text={transaction.metadata.attesterAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.recipient && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Recipient</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.recipient}
                      </code>
                      <CopyButton text={transaction.metadata.recipient} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.rollupAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Rollup</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.rollupAddress}
                      </code>
                      <CopyButton text={transaction.metadata.rollupAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.stakerAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Staker Contract</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.stakerAddress}
                      </code>
                      <CopyButton text={transaction.metadata.stakerAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.amount !== undefined && transaction.metadata.amount > 0n && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Amount (raw)</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.amount.toString()}
                    </code>
                  </div>
                )}
                {transaction.metadata.withdrawalId !== undefined && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Withdrawal ID</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.withdrawalId.toString()}
                    </code>
                  </div>
                )}
                {transaction.metadata.providerName && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Provider</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.providerName}
                    </code>
                  </div>
                )}
              </>
            )}
            {transaction.type === "action" && (
              <>
                {transaction.metadata.stepType && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Step</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {ActionStepTypeName[transaction.metadata.stepType]}
                    </code>
                  </div>
                )}
                {transaction.metadata.contractAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Contract</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.contractAddress}
                      </code>
                      <CopyButton text={transaction.metadata.contractAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.atpAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Token Vault Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.atpAddress}
                      </code>
                      <CopyButton text={transaction.metadata.atpAddress} size="sm" />
                    </div>
                  </div>
                )}
                {transaction.metadata.providerId !== undefined && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Provider ID</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.providerId}
                    </code>
                  </div>
                )}
              </>
            )}
            {transaction.type === "self-stake" && "atpAddress" in transaction.metadata && (
              <>
                {transaction.metadata.atpAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Token Vault Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.atpAddress}
                      </code>
                      <CopyButton text={transaction.metadata.atpAddress} size="sm" />
                    </div>
                  </div>
                )}
                {"amount" in transaction.metadata && transaction.metadata.amount && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Amount</div>
                    <code className="text-[10px] font-mono text-parchment">
                      {transaction.metadata.amount.toString()}
                    </code>
                  </div>
                )}
                {"operatorAddress" in transaction.metadata && transaction.metadata.operatorAddress && (
                  <div>
                    <div className="text-[10px] text-parchment/50 mb-1">Operator Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-accent break-all">
                        {transaction.metadata.operatorAddress}
                      </code>
                      <CopyButton text={transaction.metadata.operatorAddress} size="sm" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
