import { useState } from "react";

interface Provider {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  currentStake: string;
  commission: number;
  description: string;
  delegators: number;
  website: string;
}
import { formatNumber } from "../../utils/formatNumber";
import styles from "./ProvidersTable.module.css";
import { IconChevronRight } from "@tabler/icons-react";
import {
  useProviderRegisteredEvents,
  useProviderQueueLength,
} from "../../hooks/stakingRegistry";
import TakeRateDisplay from "../TakeRateDisplay";
interface ProvidersTableProps {
  providers: Provider[];
  onStake: (provider: Provider) => void;
}

// Component to display debug info for each provider
function ProviderDebugInfo({ providerId }: { providerId: number }) {
  const { queueLength } = useProviderQueueLength(providerId);
  const { events } = useProviderRegisteredEvents();

  const isRegistered = events.some(
    (event) => Number(event.args.providerIdentifier) === providerId,
  );

  return (
    <div className={styles.debugInfo}>
      <span className={styles.providerId}>ID: {providerId}</span>
      <span
        className={`${styles.queueLength} ${queueLength > 0 ? styles.registered : styles.notRegistered}`}
      >
        Queue: {queueLength}
      </span>
      <span
        className={`${styles.registrationStatus} ${isRegistered ? styles.registered : styles.notRegistered}`}
      >
        {isRegistered ? "✓ Registered" : "✗ Not registered"}
      </span>
    </div>
  );
}

export default function ProvidersTable({
  providers,
  onStake,
}: ProvidersTableProps) {
  const [sortBy, setSortBy] = useState<
    "stake" | "commission" | "name" | "delegators"
  >("stake");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedProviders = [...providers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "stake":
        comparison = parseFloat(a.currentStake) - parseFloat(b.currentStake);
        break;
      case "commission":
        // Commission sorting disabled - would need to fetch all provider take rates
        comparison = 0;
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "delegators":
        comparison = (a.delegators || 0) - (b.delegators || 0);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (
    field: "stake" | "commission" | "name" | "delegators",
  ) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getTotalStake = () => {
    return providers.reduce(
      (total, provider) => total + parseFloat(provider.currentStake),
      0,
    );
  };

  const getStakePercentage = (stake: string) => {
    const totalStake = getTotalStake();
    const providerStake = parseFloat(stake);
    return ((providerStake / totalStake) * 100).toFixed(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div>
      <table className={styles.providersTable}>
        <thead>
          <tr>
            <th>Provider</th>
            <th className={styles.sortable} onClick={() => handleSort("stake")}>
              Current Stake {getSortIcon("stake")}
            </th>
            <th
              className={styles.sortable}
              onClick={() => handleSort("commission")}
            >
              Commission {getSortIcon("commission")}
            </th>
            <th
              className={styles.sortable}
              onClick={() => handleSort("delegators")}
            >
              Delegators {getSortIcon("delegators")}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedProviders.map((provider) => (
            <tr
              key={provider.id}
              onClick={() => onStake(provider)}
              className={styles.clickableRow}
            >
              <td>
                <div className={styles.providerDetails}>
                  {provider.logo_url && (
                    <img
                      src={provider.logo_url}
                      alt={`${provider.name} logo`}
                      className={styles.providerLogo}
                    />
                  )}
                  <div>
                    <div className={styles.providerName}>{provider.name}</div>
                    <ProviderDebugInfo providerId={Number(provider.id)} />
                  </div>
                </div>
              </td>
              <td className={styles.stakeAmount}>
                {formatNumber(parseFloat(provider.currentStake))}{" "}
                <span className={styles.aztecLabel}>AZTEC</span>{" "}
                <span className={styles.stakePercentageBadge}>
                  {getStakePercentage(provider.currentStake)}%
                </span>
              </td>
              <td className={styles.commissionRate}>
                <TakeRateDisplay providerId={provider.id} />
              </td>
              <td className={styles.delegatorsCount}>
                {provider.delegators || 0}
              </td>
              <td className={styles.arrowColumn}>
                <IconChevronRight
                  className={styles.arrowRight}
                  stroke={3}
                  size={14}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {providers.length === 0 && (
        <div className={styles.emptyState}>
          <p>No providers available at the moment.</p>
          <p>Check back later or consider registering as a provider.</p>
        </div>
      )}
    </div>
  );
}
