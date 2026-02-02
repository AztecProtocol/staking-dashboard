import styles from "./AdminTools.module.css";
import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  useRegisterProvider,
  useProviderRegisteredEvents,
  useProviderQueueLength,
} from "../../hooks/stakingRegistry";
import { useAtpRegistryData } from "../../hooks";
import { contracts } from "../../contracts";
import type { Address } from "viem";

export default function AdminTools() {
  const { address } = useAccount();

  const registerProviderHook = useRegisterProvider();

  const addKeysHook = useWriteContract();
  const addKeysReceipt = useWaitForTransactionReceipt({
    hash: addKeysHook.data,
  });
  const [selectedProviderId, setSelectedProviderId] = useState<number>(1);

  const { executeAllowedAt } = useAtpRegistryData();

  // Get the owner of ATPRegistry
  const { data: atpRegistryOwner } = useReadContract({
    abi: contracts.atpRegistry.abi,
    address: contracts.atpRegistry.address,
    functionName: "owner",
  });
  const { hasRegisteredProviders, providerCount, events, refetchEvents } =
    useProviderRegisteredEvents();
  const { refetchQueueLength } = useProviderQueueLength(selectedProviderId);

  // Console log the ATPRegistry owner when it changes
  useEffect(() => {
    if (atpRegistryOwner) {
      console.log(
        "ATPRegistry owner (who can call setExecuteAllowedAt):",
        atpRegistryOwner,
      );
    }
  }, [atpRegistryOwner]);

  const isExecuteAllowedAtInPast = executeAllowedAt
    ? Number(executeAllowedAt) < Math.floor(Date.now() / 1000)
    : false;

  const formatProviderIds = () => {
    if (events.length === 0) return "none";
    if (events.length === 1) {
      return events[0].args.providerIdentifier?.toString() || "0";
    }

    const ids = events
      .map((event) => event.args.providerIdentifier?.toString())
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));

    if (ids.length <= 3) {
      return ids.join(", ");
    }

    return `${ids[0]}...${ids[ids.length - 1]}`;
  };

  const handleRegisterProvider = () => {
    if (!address) {
      console.error("No address is connected thus can't set providerAdmin");
      return;
    }
    try {
      registerProviderHook.registerProvider(address);
    } catch (error) {
      console.log("Failed to register provider", error);
    }
  };

  useEffect(() => {
    if (registerProviderHook.isSuccess) {
      refetchEvents();
    }
  }, [registerProviderHook.isSuccess, refetchEvents]);

  useEffect(() => {
    if (addKeysHook.data) {
      console.log("Keys added to provider - Transaction hash:", addKeysHook.data);
    }
    if (addKeysReceipt.isSuccess) {
      console.log("Keys added to provider - Transaction confirmed on-chain");
      // Refetch queue length when key is successfully confirmed
      refetchQueueLength();
    }
    if (addKeysHook.isError || addKeysReceipt.isError) {
      console.log(
        "Keys added to provider - Transaction failed:",
        addKeysHook.error || addKeysReceipt.error,
      );
    }
  }, [
    addKeysHook.data,
    addKeysReceipt.isSuccess,
    addKeysHook.isError,
    addKeysReceipt.isError,
    addKeysHook.error,
    addKeysReceipt.error,
    refetchQueueLength,
  ]);

  // Generate fake keystore like in tests
  const makeKeyStore = (attesterAddress: Address) => {
    return {
      attester: attesterAddress,
      publicKeyG1: {
        x: 21406448581391926982772844446548438929012710273723230115554659256913375512252n,
        y: 15111830880134453058842585834712986668147304355363816616888186003950649005068n,
      },
      publicKeyG2: {
        x0: 5143855711807468219645686078782286945336311747067561895997475661437616288545n,
        x1: 18733138756728241474327814838400205112935650107046117231230447788722289371769n,
        y0: 11666545650645167049648773780858545351306991548173957682910562744565641347660n,
        y1: 11666545650645167049648773780858545351306991548173957682910562744565641347660n,
      },
      signature: {
        x: 11658815187946308125889171893697877633198005084429559307373203442945229832414n,
        y: 10173055490169667164917203310334011859136376115031862675136213312147359258359n,
      },
    };
  };

  const handleAddKeysToProvider = async () => {
    try {
      // Generate a fake attester address based on provider ID
      const fakeAttester =
        `0x${selectedProviderId.toString().padStart(40, "0")}` as `0x${string}`;
      const keyStore = makeKeyStore(fakeAttester);

      console.log(`Adding keys to provider ${selectedProviderId}:`, {
        providerId: selectedProviderId,
        attester: fakeAttester,
        keyStore,
      });

      addKeysHook.writeContract({
        abi: contracts.stakingRegistry.abi,
        address: contracts.stakingRegistry.address,
        functionName: "addKeysToProvider",
        args: [BigInt(selectedProviderId), [keyStore]],
      });
    } catch (error) {
      console.error("Failed to add keys to provider:", error);
    }
  };

  return (
    <div className={styles.adminTools}>
      <h3>Admin Tools</h3>

      <div
        className={
          isExecuteAllowedAtInPast
            ? styles.executionAllowed
            : styles.executionNotAllowed
        }
      >
        <span>
          {isExecuteAllowedAtInPast
            ? "Execution allowed"
            : "Execution not allowed"}
        </span>
        <span className={styles.smallText}>
          Currently set to:{" "}
          {executeAllowedAt !== undefined
            ? `${new Date(Number(executeAllowedAt) * 1000).toLocaleString()}`
            : ""}
        </span>
      </div>

      <button
        className={`${styles.adminButton} ${
          styles.registerProviderBtn
        } ${registerProviderHook.isPending || registerProviderHook.isConfirming ? styles.pending : ""}`}
        onClick={handleRegisterProvider}
        disabled={
          registerProviderHook.isPending || registerProviderHook.isConfirming
        }
        title={
          !hasRegisteredProviders
            ? `No providers registered yet (count: ${providerCount})`
            : `${providerCount} provider(s) registered`
        }
      >
        {registerProviderHook.isPending || registerProviderHook.isConfirming
          ? "waiting..."
          : "Register New Mock Provider"}{" "}
        <br />
        <span className={styles.smallText}>
          Registered IDs: {formatProviderIds()}
        </span>
      </button>

      {/* Add Key to Provider Section */}
      <div className={styles.addKeySection}>
        <label className={styles.label}>Add key to Provider:</label>
        <div className={styles.inputGroup}>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(Number(e.target.value))}
            className={styles.select}
          >
            {events.length > 0 ? (
              events
                .map((event) => event.args.providerIdentifier)
                .filter(Boolean)
                .map((id) => (
                  <option key={id?.toString()} value={id?.toString()}>
                    Provider {id?.toString()}
                  </option>
                ))
            ) : (
              <option disabled value="">
                No registered providers
              </option>
            )}
          </select>
          <button
            className={`${styles.adminButton} ${styles.addKeyButton}`}
            onClick={handleAddKeysToProvider}
            disabled={addKeysHook.isPending || addKeysReceipt.isLoading}
          >
            {addKeysHook.isPending || addKeysReceipt.isLoading ? "..." : "Add"}
          </button>
        </div>
        {/* {addKeysHook.isSuccess && (
          <div className={styles.successMessage}>
            Keys added to Provider {selectedProviderId}
          </div>
        )} */}
        {(addKeysHook.isError || addKeysReceipt.isError) && (
          <div className={styles.errorMessage}>
            Failed to add keys:{" "}
            {addKeysHook.error?.message || addKeysReceipt.error?.message}
          </div>
        )}
      </div>
    </div>
  );
}
