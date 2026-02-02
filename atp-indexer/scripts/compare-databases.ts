/**
 * Database Comparison Script with Schema Mapping
 *
 * Compares old Prisma database (public schema) with new Ponder database (network schema)
 *
 * Usage:
 *   OLD_DATABASE_URL=<old-db-url> NEW_DATABASE_URL=<new-db-url> NETWORK_SCHEMA=mainnet ts-node scripts/compare-databases.ts
 * 
 * NETWORK_SCHEMA is the schema used when running ponder start --schema=NETWORK_SCHEMA
 */

import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

// Schema mapping: Prisma table name → Ponder table name
const TABLE_MAPPING: Record<string, string> = {
  'ATPPosition': 'atp_position',
  'StakedWithProvider': 'staked_with_provider',
  'Staked': 'staked',
  'Provider': 'provider',
  'ProviderAttester': 'provider_attester',
  'ProviderTakeRateUpdate': 'provider_take_rate_update',
  'ProviderRewardsRecipientUpdate': 'provider_rewards_recipient_update',
  'ProviderAdminUpdateInitiated': 'provider_admin_update_initiated',
  'ProviderAdminUpdated': 'provider_admin_updated',
  'StakerOperatorUpdate': 'staker_operator_update',
  'ProviderQueueDrip': 'provider_queue_drip',
  'Deposit': 'deposit',
  'FailedDeposit': 'failed_deposit',
};

// Column name mapping: Prisma camelCase → Ponder snake_case
const COLUMN_MAPPING: Record<string, string> = {
  // Standard fields
  'blockNumber': 'block_number',
  'txHash': 'tx_hash',
  'logIndex': 'log_index',
  'timestamp': 'timestamp',

  // Addresses
  'stakerAddress': 'staker_address',
  'operatorAddress': 'operator_address',
  'attesterAddress': 'attester_address',
  'withdrawerAddress': 'withdrawer_address',
  'rollupAddress': 'rollup_address',
  'atpAddress': 'atp_address',
  'splitContractAddress': 'split_contract_address',

  // Provider fields
  'providerIdentifier': 'provider_identifier',
  'providerAdmin': 'provider_admin',
  'providerTakeRate': 'provider_take_rate',
  'rewardsRecipient': 'rewards_recipient',
  'providerRewardsRecipient': 'provider_rewards_recipient',

  // Amounts
  'stakedAmount': 'staked_amount',
  'allocation': 'allocation',
  'amount': 'amount',

  // Public keys (BLS12-381)
  'publicKeyG1X': 'public_key_g_1_x',
  'publicKeyG1Y': 'public_key_g_1_y',
  'publicKeyG2X0': 'public_key_g_2_x_0',
  'publicKeyG2X1': 'public_key_g_2_x_1',
  'publicKeyG2Y0': 'public_key_g_2_y_0',
  'publicKeyG2Y1': 'public_key_g_2_y_1',
  'proofOfPossessionX': 'proof_of_possession_x',
  'proofOfPossessionY': 'proof_of_possession_y',

  // Update fields
  'newTakeRate': 'new_take_rate',
  'previousTakeRate': 'previous_take_rate',
  'newRewardsRecipient': 'new_rewards_recipient',
  'previousRewardsRecipient': 'previous_rewards_recipient',
  'newAdmin': 'new_admin',
  'previousAdmin': 'previous_admin',
  'newOperator': 'new_operator',
  'previousOperator': 'previous_operator',

  // Other fields
  'address': 'address',
  'beneficiary': 'beneficiary',
  'type': 'type',
};

// Fields to exclude from comparison (synthetic keys, timestamps)
const EXCLUDED_FIELDS = ['id', 'createdAt', 'updatedAt'];

// Fields added in Ponder (not in old schema) (staked table)
const NEW_FIELDS: Record<string, string[]> = {
  'staked': ['staked_amount'],
};

interface ComparisonResult {
  oldTable: string;
  newTable: string;
  oldCount: number;
  newCount: number;
  match: boolean;
  sampleMatch: boolean;
  errors: string[];
}

async function connectDatabase(url: string, name: string): Promise<Client> {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log(`✅ Connected to ${name} database`);
  return client;
}

async function getRowCount(client: Client, schemaQualifiedTable: string): Promise<number> {
  const result = await client.query(`SELECT COUNT(*) as count FROM ${schemaQualifiedTable}`);
  return parseInt(result.rows[0].count);
}

async function getBlockRange(client: Client, schemaQualifiedTable: string, isPonder = false): Promise<{ min: string; max: string }> {
  try {
    const blockNumberCol = isPonder ? 'block_number' : '"blockNumber"';
    const result = await client.query(`
      SELECT MIN(${blockNumberCol}) as min, MAX(${blockNumberCol}) as max
      FROM ${schemaQualifiedTable}
    `);
    return {
      min: result.rows[0]?.min || '0',
      max: result.rows[0]?.max || '0'
    };
  } catch {
    return { min: 'N/A', max: 'N/A' };
  }
}

async function getSampleRecords(client: Client, schemaQualifiedTable: string, isPonder = false, limit = 5): Promise<any[]> {
  try {
    const blockNumberCol = isPonder ? 'block_number' : '"blockNumber"';
    const logIndexCol = isPonder ? 'log_index' : '"logIndex"';
    const result = await client.query(`
      SELECT * FROM ${schemaQualifiedTable}
      ORDER BY ${blockNumberCol} ASC, ${logIndexCol} ASC
      LIMIT ${limit}
    `);
    return result.rows;
  } catch (error) {
    console.error(`Error getting samples from ${schemaQualifiedTable}:`, error);
    return [];
  }
}

function normalizeValue(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val.toLowerCase().trim();
  return String(val);
}

function compareRecords(oldTable: string, oldRecord: any, newRecord: any): string[] {
  const errors: string[] = [];

  // Get fields to compare (exclude id, createdAt, etc.)
  const oldKeys = Object.keys(oldRecord).filter(k => !EXCLUDED_FIELDS.includes(k));
  const newFieldsToSkip = NEW_FIELDS[TABLE_MAPPING[oldTable]] || [];

  for (const key of oldKeys) {
    // Map Prisma column name to Ponder column name
    const ponderKey = COLUMN_MAPPING[key] || key;

    // Skip if this field is new in Ponder
    if (newFieldsToSkip.includes(ponderKey)) continue;

    const oldVal = normalizeValue(oldRecord[key]);
    const newVal = normalizeValue(newRecord[ponderKey]);

    if (oldVal !== newVal) {
      errors.push(`${key}->${ponderKey}: old="${oldVal.substring(0, 50)}" new="${newVal.substring(0, 50)}"`);
    }
  }

  return errors;
}

async function findMatchingRecord(
  newClient: Client,
  schemaQualifiedTable: string,
  oldRecord: any,
  tableName: string
): Promise<any | null> {
  try {
    // Special case for ProviderAttester: use txHash, logIndex, providerIdentifier, attesterAddress
    if (tableName === 'provider_attester') {
      if (!oldRecord.txHash || oldRecord.logIndex === undefined || !oldRecord.providerIdentifier || !oldRecord.attesterAddress) {
        return null;
      }

      const result = await newClient.query(
        `SELECT * FROM ${schemaQualifiedTable} WHERE tx_hash = $1 AND log_index = $2 AND provider_identifier = $3 AND attester_address = $4 LIMIT 1`,
        [oldRecord.txHash, oldRecord.logIndex, oldRecord.providerIdentifier, oldRecord.attesterAddress]
      );
      return result.rows[0] || null;
    }

    // Default: compare by txHash and logIndex (the universal unique identifier)
    if (!oldRecord.txHash || oldRecord.logIndex === undefined) {
      return null;
    }

    // Use snake_case column names for Ponder
    const result = await newClient.query(
      `SELECT * FROM ${schemaQualifiedTable} WHERE tx_hash = $1 AND log_index = $2 LIMIT 1`,
      [oldRecord.txHash, oldRecord.logIndex]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

async function compareTable(
  oldClient: Client,
  newClient: Client,
  oldTable: string,
  newTable: string,
  oldSchema: string,
  newSchema: string
): Promise<ComparisonResult> {
  const oldQualified = `${oldSchema}."${oldTable}"`;
  const newQualified = `${newSchema}."${newTable}"`;

  console.log(`\n📊 Comparing ${oldQualified} → ${newQualified}...`);

  const result: ComparisonResult = {
    oldTable,
    newTable,
    oldCount: 0,
    newCount: 0,
    match: false,
    sampleMatch: true,
    errors: []
  };

  try {
    // Get row counts
    result.oldCount = await getRowCount(oldClient, oldQualified);
    result.newCount = await getRowCount(newClient, newQualified);

    console.log(`   Old: ${result.oldCount} rows`);
    console.log(`   New: ${result.newCount} rows`);

    // Check count match
    if (result.oldCount !== result.newCount) {
      result.errors.push(`Count mismatch: ${result.oldCount} vs ${result.newCount}`);
    }

    // Get block ranges
    const oldRange = await getBlockRange(oldClient, oldQualified, false);
    const newRange = await getBlockRange(newClient, newQualified, true);

    if (oldRange.min !== 'N/A' && newRange.min !== 'N/A') {
      console.log(`   Old blocks: ${oldRange.min} - ${oldRange.max}`);
      console.log(`   New blocks: ${newRange.min} - ${newRange.max}`);

      if (oldRange.min !== newRange.min || oldRange.max !== newRange.max) {
        result.errors.push(`Block range mismatch`);
      }
    }

    // Compare ALL records (not just samples)
    if (result.oldCount > 0 && result.newCount > 0) {
      console.log(`   Comparing all ${result.oldCount} records...`);

      // Fetch ALL records from old DB
      const allOldRecords = await oldClient.query(
        `SELECT * FROM ${oldQualified} ORDER BY "blockNumber" ASC, "logIndex" ASC`
      );

      let notFoundCount = 0;
      let fieldMismatchCount = 0;

      for (const oldRecord of allOldRecords.rows) {
        const newRecord = await findMatchingRecord(newClient, newQualified, oldRecord, newTable);

        if (!newRecord) {
          const identifier = oldRecord.txHash || oldRecord.address || oldRecord.providerIdentifier || 'unknown';
          if (notFoundCount < 5) { // Only show first 5
            result.errors.push(`Record not found: ${identifier}`);
          }
          notFoundCount++;
        } else {
          const fieldErrors = compareRecords(oldTable, oldRecord, newRecord);
          if (fieldErrors.length > 0) {
            const identifier = oldRecord.txHash || oldRecord.address || 'unknown';
            if (fieldMismatchCount < 5) { // Only show first 5
              result.errors.push(`Field mismatch in ${identifier}: ${fieldErrors.slice(0, 3).join('; ')}`);
            }
            fieldMismatchCount++;
          }
        }
      }

      if (notFoundCount > 5) {
        result.errors.push(`... and ${notFoundCount - 5} more records not found`);
      }
      if (fieldMismatchCount > 5) {
        result.errors.push(`... and ${fieldMismatchCount - 5} more field mismatches`);
      }

      console.log(`   Not found: ${notFoundCount}, Field mismatches: ${fieldMismatchCount}`);
      result.sampleMatch = notFoundCount === 0 && fieldMismatchCount === 0;
    }

    result.match = result.errors.length === 0;

    if (result.match) {
      console.log(`   ✅ MATCH`);
    } else {
      console.log(`   ❌ ${result.errors.length} issue(s)`);
    }

  } catch (error) {
    result.errors.push(`Comparison error: ${error}`);
    console.log(`   ❌ Error: ${error}`);
  }

  return result;
}

async function main() {
  console.log('🔍 Database Comparison Tool');
  console.log('Comparing Prisma DB (public schema) with Ponder DB (network schema)\n');
  console.log('============================================================================\n');

  const oldDbUrl = process.env.OLD_DATABASE_URL;
  const newDbUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  const networkSchema = process.env.NETWORK_SCHEMA || 'sepolia'; // Default to sepolia (CHAIN_ID=11155111) 

  if (!oldDbUrl) {
    console.error('❌ OLD_DATABASE_URL environment variable not set');
    console.error('   Usage: OLD_DATABASE_URL=<url> NEW_DATABASE_URL=<url> NETWORK_SCHEMA=mainnet ts-node scripts/compare-databases.ts');
    process.exit(1);
  }

  if (!newDbUrl) {
    console.error('❌ NEW_DATABASE_URL (or DATABASE_URL) environment variable not set');
    process.exit(1);
  }

  console.log(`📦 Old schema: public`);
  console.log(`📦 New schema: ${networkSchema}\n`);

  let oldClient: Client | null = null;
  let newClient: Client | null = null;

  try {
    // Connect to databases
    console.log('📡 Connecting to databases...\n');
    oldClient = await connectDatabase(oldDbUrl, 'OLD (Prisma/public)');
    newClient = await connectDatabase(newDbUrl, `NEW (Ponder/${networkSchema})`);

    console.log('\n============================================================================');

    // Compare all tables
    const results: ComparisonResult[] = [];

    for (const [oldTable, newTable] of Object.entries(TABLE_MAPPING)) {
      const result = await compareTable(
        oldClient,
        newClient,
        oldTable,
        newTable,
        'public',
        networkSchema
      );
      results.push(result);
    }

    // Print summary
    console.log('\n\n============================================================================');
    console.log('📋 COMPARISON SUMMARY');
    console.log('============================================================================\n');

    const passed = results.filter(r => r.match).length;
    const failed = results.filter(r => !r.match).length;
    const totalOldRows = results.reduce((sum, r) => sum + r.oldCount, 0);
    const totalNewRows = results.reduce((sum, r) => sum + r.newCount, 0);

    console.log(`Tables compared: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`\nTotal rows - Old: ${totalOldRows} | New: ${totalNewRows}\n`);

    if (failed > 0) {
      console.log('Failed tables:\n');
      results
        .filter(r => !r.match)
        .forEach(r => {
          console.log(`  ❌ ${r.oldTable}:`);
          console.log(`     Old: ${r.oldCount} rows | New: ${r.newCount} rows`);
          console.log(`     Issues:`);
          r.errors.slice(0, 5).forEach(err => console.log(`       - ${err}`));
          if (r.errors.length > 5) {
            console.log(`       ... and ${r.errors.length - 5} more issues`);
          }
          console.log('');
        });

      console.log('============================================================================\n');
      console.log('⚠️  Some tables have mismatches. Review the issues above.');
      console.log('    Note: Minor differences may be acceptable (e.g., new fields in Ponder)\n');
      process.exit(1);
    } else {
      console.log('🎉 All tables match! Data integrity verified.\n');
      console.log('============================================================================\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Comparison failed:', error);
    process.exit(1);
  } finally {
    if (oldClient) await oldClient.end();
    if (newClient) await newClient.end();
  }
}

main();
