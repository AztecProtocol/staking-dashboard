import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import {
  EXTERNAL_GOVERNANCE_FRONTENDS,
  type ExternalFrontend,
} from "@/config/externalGovernance";

interface ExternalGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExternalGovernanceModal({
  isOpen,
  onClose,
}: ExternalGovernanceModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 modal-scrim z-50 flex items-center justify-center p-4">
      <div className="card-dark max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-oracle-standard text-xl text-parchment">
            Governance
          </h3>
          <button
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment transition-colors p-2"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-parchment/80 text-sm mb-6">
          Access Aztec governance through one of the community-hosted frontends
          below:
        </p>

        {/* Frontends List */}
        <div className="space-y-4">
          {EXTERNAL_GOVERNANCE_FRONTENDS.map((frontend, index) => (
            <FrontendItem key={index} frontend={frontend} />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 btn-glass text-xs"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

function FrontendItem({ frontend }: { frontend: ExternalFrontend }) {
  const isComingSoon = !frontend.url;

  return (
    <div className="p-4 glass transition-colors">
      <div className="flex items-center justify-between">
        <div>
          {isComingSoon ? (
            <span className="font-oracle-standard text-parchment/60">
              {frontend.name}
            </span>
          ) : (
            <a
              href={frontend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-oracle-standard text-parchment hover:text-accent transition-colors"
            >
              {frontend.name}
              <Icon name="externalLink" className="w-4 h-4 inline ml-2" />
            </a>
          )}
          <p className="text-sm text-parchment/60 mt-1">
            Hosted by {frontend.hostedBy}
          </p>
        </div>
        {isComingSoon && (
          <span className="text-xs text-accent font-oracle-standard px-2 py-1 border border-parchment/20 rounded-inset">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}
