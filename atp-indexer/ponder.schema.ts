import { onchainTable, onchainEnum, index, relations } from "ponder";

/**
 * ATP Type enum
 */
export const atpType = onchainEnum("atp_type", ["MATP", "LATP", "NCATP", "Unknown"]);

/**
 * ATP Position
 */
export const atpPosition = onchainTable("atp_position", (t) => ({
  address: t.hex().notNull().primaryKey(),
  beneficiary: t.hex().notNull(),
  allocation: t.bigint().notNull(),
  type: atpType("type").notNull(),
  stakerAddress: t.hex().notNull(),
  operatorAddress: t.hex(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  addressIdx: index().on(table.address),
  beneficiaryIdx: index().on(table.beneficiary),
  stakerAddressIdx: index().on(table.stakerAddress),
}));

export const atpPositionRelations = relations(atpPosition, ({ many }) => ({
  stakingOperations: many(stakedWithProvider),
  directStakes: many(staked),
  operatorUpdateHistory: many(stakerOperatorUpdate),
}));

/**
 * Provider
 */
export const provider = onchainTable("provider", (t) => ({
  providerIdentifier: t.text().notNull().primaryKey(),
  providerAdmin: t.hex().notNull(),
  providerTakeRate: t.integer().notNull(),
  rewardsRecipient: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
  providerAdminIdx: index().on(table.providerAdmin),
}));

export const providerRelations = relations(provider, ({ many }) => ({
  stakedWithProvider: many(stakedWithProvider),
  attesters: many(providerAttester),
  takeRateUpdates: many(providerTakeRateUpdate),
  rewardsRecipientUpdates: many(providerRewardsRecipientUpdate),
  adminUpdateInitiatedEvents: many(providerAdminUpdateInitiated),
  adminUpdatedEvents: many(providerAdminUpdated),
}));

/**
 * StakedWithProvider
 */
export const stakedWithProvider = onchainTable("staked_with_provider", (t) => ({
  id: t.text().primaryKey(),
  atpAddress: t.hex().notNull(),
  stakerAddress: t.hex().notNull(),
  operatorAddress: t.hex().notNull(),
  splitContractAddress: t.hex().notNull(),
  providerIdentifier: t.text().notNull(),
  rollupAddress: t.hex().notNull(),
  attesterAddress: t.hex().notNull(),
  stakedAmount: t.bigint().notNull(),
  providerTakeRate: t.integer().notNull(),
  providerRewardsRecipient: t.hex().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  atpAddressIdx: index().on(table.atpAddress),
  providerIdentifierIdx: index().on(table.providerIdentifier),
  attesterAddressIdx: index().on(table.attesterAddress),
}));

export const stakedWithProviderRelations = relations(stakedWithProvider, ({ one }) => ({
  atp: one(atpPosition, {
    fields: [stakedWithProvider.atpAddress],
    references: [atpPosition.address],
  }),
  provider: one(provider, {
    fields: [stakedWithProvider.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * ERC20StakedWithProvider (Direct ERC20 staking without ATP)
 * Tracks staking events where users stake ERC20 tokens directly via StakingRegistry.stake()
 */
export const erc20StakedWithProvider = onchainTable("erc20_staked_with_provider", (t) => ({
  id: t.text().primaryKey(),
  stakerAddress: t.hex().notNull(),             // msg.sender (EOA wallet)
  splitContractAddress: t.hex().notNull(),
  providerIdentifier: t.text().notNull(),
  rollupAddress: t.hex().notNull(),
  attesterAddress: t.hex().notNull(),
  stakedAmount: t.bigint().notNull(),
  providerTakeRate: t.integer().notNull(),
  providerRewardsRecipient: t.hex().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  stakerAddressIdx: index().on(table.stakerAddress),
  providerIdentifierIdx: index().on(table.providerIdentifier),
  attesterAddressIdx: index().on(table.attesterAddress),
}));

export const erc20StakedWithProviderRelations = relations(erc20StakedWithProvider, ({ one }) => ({
  provider: one(provider, {
    fields: [erc20StakedWithProvider.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * Staked (Direct Staking)
 */
export const staked = onchainTable("staked", (t) => ({
  id: t.text().primaryKey(),
  atpAddress: t.hex().notNull(),
  stakerAddress: t.hex().notNull(),
  operatorAddress: t.hex().notNull(),
  attesterAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  stakedAmount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  atpAddressIdx: index().on(table.atpAddress),
  attesterAddressIdx: index().on(table.attesterAddress),
}));

export const stakedRelations = relations(staked, ({ one }) => ({
  atp: one(atpPosition, {
    fields: [staked.atpAddress],
    references: [atpPosition.address],
  }),
}));

/**
 * ProviderAttester
 */
export const providerAttester = onchainTable("provider_attester", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  attesterAddress: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

export const providerAttesterRelations = relations(providerAttester, ({ one }) => ({
  provider: one(provider, {
    fields: [providerAttester.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * ProviderTakeRateUpdate
 */
export const providerTakeRateUpdate = onchainTable("provider_take_rate_update", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  newTakeRate: t.integer().notNull(),
  previousTakeRate: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

export const providerTakeRateUpdateRelations = relations(providerTakeRateUpdate, ({ one }) => ({
  provider: one(provider, {
    fields: [providerTakeRateUpdate.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * ProviderRewardsRecipientUpdate
 */
export const providerRewardsRecipientUpdate = onchainTable("provider_rewards_recipient_update", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  newRewardsRecipient: t.hex().notNull(),
  previousRewardsRecipient: t.hex(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

export const providerRewardsRecipientUpdateRelations = relations(providerRewardsRecipientUpdate, ({ one }) => ({
  provider: one(provider, {
    fields: [providerRewardsRecipientUpdate.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * ProviderAdminUpdateInitiated
 */
export const providerAdminUpdateInitiated = onchainTable("provider_admin_update_initiated", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  newAdmin: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

export const providerAdminUpdateInitiatedRelations = relations(providerAdminUpdateInitiated, ({ one }) => ({
  provider: one(provider, {
    fields: [providerAdminUpdateInitiated.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * ProviderAdminUpdated
 */
export const providerAdminUpdated = onchainTable("provider_admin_updated", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  newAdmin: t.hex().notNull(),
  previousAdmin: t.hex(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

export const providerAdminUpdatedRelations = relations(providerAdminUpdated, ({ one }) => ({
  provider: one(provider, {
    fields: [providerAdminUpdated.providerIdentifier],
    references: [provider.providerIdentifier],
  }),
}));

/**
 * StakerOperatorUpdate
 */
export const stakerOperatorUpdate = onchainTable("staker_operator_update", (t) => ({
  id: t.text().primaryKey(),
  stakerAddress: t.hex().notNull(), // Linked to ATPPosition.address
  newOperator: t.hex().notNull(),
  previousOperator: t.hex(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  stakerAddressIdx: index().on(table.stakerAddress),
}));

export const stakerOperatorUpdateRelations = relations(stakerOperatorUpdate, ({ one }) => ({
  atp: one(atpPosition, {
    fields: [stakerOperatorUpdate.stakerAddress],
    references: [atpPosition.address],
  }),
}));

/**
 * ProviderQueueDrip (Standalone)
 */
export const providerQueueDrip = onchainTable("provider_queue_drip", (t) => ({
  id: t.text().primaryKey(),
  providerIdentifier: t.text().notNull(),
  attesterAddress: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  providerIdentifierIdx: index().on(table.providerIdentifier),
}));

/**
 * Deposit (Standalone)
 */
export const deposit = onchainTable("deposit", (t) => ({
  id: t.text().primaryKey(),
  attesterAddress: t.hex().notNull(),
  withdrawerAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  publicKeyG1X: t.bigint().notNull(),
  publicKeyG1Y: t.bigint().notNull(),
  publicKeyG2X0: t.bigint().notNull(),
  publicKeyG2X1: t.bigint().notNull(),
  publicKeyG2Y0: t.bigint().notNull(),
  publicKeyG2Y1: t.bigint().notNull(),
  proofOfPossessionX: t.bigint().notNull(),
  proofOfPossessionY: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  attesterAddressIdx: index().on(table.attesterAddress),
}));

/**
 * FailedDeposit (Standalone)
 */
export const failedDeposit = onchainTable("failed_deposit", (t) => ({
  id: t.text().primaryKey(),
  attesterAddress: t.hex().notNull(),
  withdrawerAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  publicKeyG1X: t.bigint().notNull(),
  publicKeyG1Y: t.bigint().notNull(),
  publicKeyG2X0: t.bigint().notNull(),
  publicKeyG2X1: t.bigint().notNull(),
  publicKeyG2Y0: t.bigint().notNull(),
  publicKeyG2Y1: t.bigint().notNull(),
  proofOfPossessionX: t.bigint().notNull(),
  proofOfPossessionY: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  attesterAddressIdx: index().on(table.attesterAddress),
}));

/**
 * WithdrawInitiated (Standalone)
 */
export const withdrawInitiated = onchainTable("withdraw_initiated", (t) => ({
  id: t.text().primaryKey(),
  attesterAddress: t.hex().notNull(),
  recipientAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  amount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  attesterAddressIdx: index().on(table.attesterAddress),
  recipientAddressIdx: index().on(table.recipientAddress),
}));

/**
 * WithdrawFinalized (Standalone)
 */
export const withdrawFinalized = onchainTable("withdraw_finalized", (t) => ({
  id: t.text().primaryKey(),
  attesterAddress: t.hex().notNull(),
  recipientAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  amount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  attesterAddressIdx: index().on(table.attesterAddress),
  recipientAddressIdx: index().on(table.recipientAddress),
}));

/**
 * Slashed (Standalone)
 * Records slashing events for attesters
 */
export const slashed = onchainTable("slashed", (t) => ({
  id: t.text().primaryKey(),
  attesterAddress: t.hex().notNull(),
  rollupAddress: t.hex().notNull(),
  amount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  attesterAddressIdx: index().on(table.attesterAddress),
}));

/**
 * TokensWithdrawnToBeneficiary
 * Tracks when tokens are withdrawn from staker to beneficiary
 */
export const tokensWithdrawnToBeneficiary = onchainTable("tokens_withdrawn_to_beneficiary", (t) => ({
  id: t.text().primaryKey(),
  stakerAddress: t.hex().notNull(),
  atpAddress: t.hex(),
  beneficiary: t.hex().notNull(),
  amount: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  logIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
}), (table) => ({
  beneficiaryIdx: index().on(table.beneficiary),
  atpAddressIdx: index().on(table.atpAddress),
  stakerAddressIdx: index().on(table.stakerAddress),
}));
