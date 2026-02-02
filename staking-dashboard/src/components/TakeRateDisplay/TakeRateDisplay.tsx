import { useProviderConfigurations } from "../../hooks/stakingRegistry";

interface TakeRateDisplayProps {
  providerId: string | number;
}

export default function TakeRateDisplay({ providerId }: TakeRateDisplayProps) {
  const { providerTakeRate } = useProviderConfigurations(Number(providerId));

  // Convert from basis points to percentage (1000 basis points = 10%)
  const displayRate = providerTakeRate ? (providerTakeRate / 100).toFixed(1) : null;

  return <span>{displayRate ? `${displayRate}%` : "—%"}</span>;
}