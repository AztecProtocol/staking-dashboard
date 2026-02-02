import { Icon } from "@/components/Icon"
import { useTransactionCart } from "@/contexts/TransactionCartContext"
import { TransactionCartExpanded } from "./TransactionCartExpanded"

/**
 * Transaction cart component that hovers at the bottom of the screen
 * Displays pending transactions and allows batch execution
 */
export const TransactionCart = () => {
  const { transactions, isCartOpen, openCart, closeCart } = useTransactionCart()

  const pendingCount = transactions.filter(tx => tx.status === 'pending' || tx.status === undefined).length

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-22 z-50 pointer-events-none">
      <div className="pointer-events-auto px-4 md:px-0">
        <div
          className={`bg-ink border-2 shadow-2xl transition-all duration-300 ease-out ${
            isCartOpen
              ? 'w-full md:w-[600px] border-chartreuse/40'
              : 'w-full md:w-auto border-parchment/20 hover:border-chartreuse/30'
          }`}
        >
          {/* Collapsed State - Minimal Button */}
          {!isCartOpen && (
            <button
              onClick={openCart}
              className="flex items-center gap-3 justify-between w-full p-3 hover:bg-chartreuse/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-chartreuse/20 border-2 border-chartreuse flex items-center justify-center relative group-hover:bg-chartreuse/30 transition-colors">
                  <Icon name="shoppingCart" className="w-5 h-5 md:w-6 md:h-6 text-chartreuse" />
                  {pendingCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-vermillion text-parchment rounded-full flex items-center justify-center text-xs font-bold border-2 border-ink">
                      {pendingCount}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="font-oracle-standard text-xs font-bold uppercase tracking-wide text-parchment group-hover:text-chartreuse transition-colors">
                    TX Batch
                  </h3>
                  <p className="text-[10px] text-parchment/60">
                    {pendingCount} pending
                  </p>
                </div>
              </div>
              <Icon name="chevronUp" className="text-parchment/60 group-hover:text-chartreuse transition-colors" />
            </button>
          )}

          {/* Expanded State - Full Cart */}
          {isCartOpen && (
            <TransactionCartExpanded onMinimize={closeCart} />
          )}
        </div>
      </div>
    </div>
  )
}
