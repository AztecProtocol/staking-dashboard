type NetworkShortName = {
    shortName: string;
    chainId: bigint;
};
export declare const networks: NetworkShortName[];
export declare const getNetworkShortName: (chainId: bigint) => string;
export declare const getTransactionServiceUrl: (chainId: bigint) => string;
export {};
//# sourceMappingURL=config.d.ts.map