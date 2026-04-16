// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

/// @notice Minimal mock of the staking dashboard's StakingRegistry.
/// Implements the getters the frontend reads (ROLLUP_REGISTRY, STAKING_ASSET,
/// PULL_SPLIT_FACTORY) plus provider registration so the Ponder indexer
/// can index ProviderRegistered events and populate the providers list.
contract MockStakingRegistry {
    address public immutable ROLLUP_REGISTRY;
    address public immutable STAKING_ASSET;
    address public immutable PULL_SPLIT_FACTORY;
    uint256 public nextProviderIdentifier;

    struct ProviderConfig {
        address providerAdmin;
        uint16 providerTakeRate;
        address providerRewardsRecipient;
    }

    mapping(uint256 => ProviderConfig) public providerConfigurations;

    event ProviderRegistered(
        uint256 indexed providerIdentifier,
        address indexed providerAdmin,
        uint16 indexed providerTakeRate
    );

    constructor(address _rollupRegistry, address _stakingAsset, address _pullSplitFactory) {
        ROLLUP_REGISTRY = _rollupRegistry;
        STAKING_ASSET = _stakingAsset;
        PULL_SPLIT_FACTORY = _pullSplitFactory;
    }

    /// @notice Register a test provider. Emits ProviderRegistered for Ponder to index.
    function registerProvider(
        uint256 _providerIdentifier,
        address _providerAdmin,
        uint16 _takeRate,
        address _rewardsRecipient
    ) external {
        providerConfigurations[_providerIdentifier] = ProviderConfig({
            providerAdmin: _providerAdmin,
            providerTakeRate: _takeRate,
            providerRewardsRecipient: _rewardsRecipient
        });
        nextProviderIdentifier = _providerIdentifier + 1;
        emit ProviderRegistered(_providerIdentifier, _providerAdmin, _takeRate);
    }
}
