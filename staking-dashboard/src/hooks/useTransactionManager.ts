import { useEffect, useRef } from "react";

export interface TransactionHook {
  isSuccess: boolean;
  isPending: boolean;
  error: Error | null;
  txHash?: string;
  isError?: boolean;
  [key: string]: unknown;
}

export interface TransactionMonitorConfig {
  hook: TransactionHook;
  id?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useTransactionManager(configs: TransactionMonitorConfig[]) {
  const prevStatesRef = useRef<
    Map<string, { isSuccess: boolean; hasError: boolean; isPending: boolean }>
  >(new Map());

  useEffect(() => {
    configs.forEach(({ hook, id, onSuccess, onError }) => {
      const hookId = id || "Transaction";
      const currentState = {
        isSuccess: hook.isSuccess,
        hasError: !!(hook.error || hook.isError),
        isPending: hook.isPending,
      };
      const prevState = prevStatesRef.current.get(hookId);

      // Only trigger callbacks and logging when state changes
      if (currentState.isPending && (!prevState || !prevState.isPending)) {
        console.log(`⏳ ${hookId} pending...`);
      } else if (
        currentState.isSuccess &&
        (!prevState || !prevState.isSuccess)
      ) {
        console.log(`✅ ${hookId} successful! Hash:`, hook.txHash);
        if (onSuccess) {
          onSuccess();
        }
      } else if (currentState.hasError && (!prevState || !prevState.hasError)) {
        console.error(
          `❌ ${hookId} failed:`,
          hook.error ? hook.error.message : "Unknown error",
        );
        if (onError && hook.error) {
          onError(hook.error);
        }
      }

      // Update the previous state
      prevStatesRef.current.set(hookId, currentState);
    });
  }, [configs]);
}
