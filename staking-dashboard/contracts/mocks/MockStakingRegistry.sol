// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

/// @notice Minimal mock — the real StakingRegistry isn't in aztec-packages.
/// Returns ROLLUP_REGISTRY() and STAKING_ASSET() for frontend discovery.
contract MockStakingRegistry {
    address public immutable ROLLUP_REGISTRY;
    address public immutable STAKING_ASSET;
    address public immutable PULL_SPLIT_FACTORY;
    uint256 public nextProviderIdentifier;

    constructor(address _rollupRegistry, address _stakingAsset, address _pullSplitFactory) {
        ROLLUP_REGISTRY = _rollupRegistry;
        STAKING_ASSET = _stakingAsset;
        PULL_SPLIT_FACTORY = _pullSplitFactory;
    }
}
