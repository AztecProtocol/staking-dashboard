import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

interface SafeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Friendly banner suggesting Safe wallet for users with large Token Vaults
 */
export const SafeWarningModal = ({ isOpen, onClose }: SafeWarningModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 modal-scrim z-50 flex items-center justify-center p-4">
      <div className="card-dark max-w-2xl w-full p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-arizona-serif text-2xl text-parchment">
            Batch Staking with Safe
          </h3>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment transition-colors p-2"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <div className="bg-parchment/5 border border-parchment/15 p-5 mb-6 rounded-inset">
            <p className="font-oracle-standard text-base text-parchment/90 leading-relaxed">
              It will be tedious to batch stake/delegate without a gnosis safe. You will have to do <strong>3 + n transactions</strong>, where n is the number of times you can stake.
            </p>
          </div>

          <p className="text-sm text-parchment/80 font-arizona-text leading-relaxed">
            Please refer to the guide on setting up a safe and batch staking, or contact us for assistance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <a
            href="https://app.safe.global"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-lime px-6 py-3 text-xs"
          >
            <span>View Guide</span>
            <Icon name="externalLink" size="sm" />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 btn-glass px-6 py-3 text-xs"
          >
            <span>Contact Us</span>
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-parchment/60 hover:text-parchment text-sm font-arizona-text underline ml-auto"
          >
            I'm okay, don't show again
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
