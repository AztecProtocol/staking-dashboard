import { SafeOperation } from '@safe-global/types-kit';
import { AddSafeOperationProps } from '../types/safeTransactionServiceTypes';
export declare const getAddSafeOperationProps: (safeOperation: SafeOperation) => Promise<{
    entryPoint: string;
    moduleAddress: string;
    safeAddress: string;
    userOperation: import("@safe-global/types-kit").UserOperation;
    options: {
        validAfter: number | undefined;
        validUntil: number | undefined;
    };
}>;
export declare const isSafeOperation: (obj: AddSafeOperationProps | SafeOperation) => obj is SafeOperation;
//# sourceMappingURL=safeOperation.d.ts.map