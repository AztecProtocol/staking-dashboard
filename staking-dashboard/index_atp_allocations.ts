import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

const RPC_URL = 'https://lb.drpc.org/ogrpc?network=ethereum&dkey=Ak0qdxVWbkqUmLb-dN5Iplwca0Q6klER8I3ozltYSRe_';

const ATP_FACTORY = '0xEB7442dc9392866324421bfe9aC5367AD9Bbb3A6' as const;
const ATP_FACTORY_AUCTION = '0x42Df694EdF32d5AC19A75E1c7f91C982a7F2a161' as const;
const START_BLOCK = 23786855n;

const ATPCreatedEvent = parseAbiItem('event ATPCreated(address indexed beneficiary, address indexed atp, uint256 allocation)');

interface AllocationData {
  beneficiary: string;
  atp: string;
  allocation: bigint;
  blockNumber: bigint;
  transactionHash: string;
  factory: string;
}

async function fetchLogsInBatches(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint,
  batchSize: bigint = 50000n
) {
  const allLogs: Awaited<ReturnType<typeof client.getLogs>>= [];
  let currentFrom = fromBlock;

  while (currentFrom <= toBlock) {
    const currentTo = currentFrom + batchSize > toBlock ? toBlock : currentFrom + batchSize;
    process.stdout.write(`  Fetching blocks ${currentFrom} to ${currentTo}...`);

    const logs = await client.getLogs({
      address,
      event: ATPCreatedEvent,
      fromBlock: currentFrom,
      toBlock: currentTo,
    });

    console.log(` found ${logs.length} events`);
    allLogs.push(...logs);
    currentFrom = currentTo + 1n;
  }

  return allLogs;
}

async function main() {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);
  console.log(`Scanning from block ${START_BLOCK} to ${currentBlock}`);
  console.log('');

  // Fetch logs from both factories in batches
  console.log('Fetching logs from atpFactory...');
  const factory1Logs = await fetchLogsInBatches(client, ATP_FACTORY, START_BLOCK, currentBlock);
  console.log(`  Total: ${factory1Logs.length} events`);

  console.log('Fetching logs from atpFactoryAuction...');
  const factory2Logs = await fetchLogsInBatches(client, ATP_FACTORY_AUCTION, START_BLOCK, currentBlock);
  console.log(`  Total: ${factory2Logs.length} events`);
  console.log('');

  // Parse all allocations
  const allocations: AllocationData[] = [];

  for (const log of factory1Logs) {
    allocations.push({
      beneficiary: log.args.beneficiary!,
      atp: log.args.atp!,
      allocation: log.args.allocation!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      factory: 'atpFactory',
    });
  }

  for (const log of factory2Logs) {
    allocations.push({
      beneficiary: log.args.beneficiary!,
      atp: log.args.atp!,
      allocation: log.args.allocation!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      factory: 'atpFactoryAuction',
    });
  }

  // Calculate statistics
  const totalParticipants = allocations.length;
  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation, 0n);

  console.log('='.repeat(60));
  console.log('TOKEN SALE PARTICIPATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Participants: ${totalParticipants.toLocaleString()}`);
  console.log(`Total Allocation: ${formatUnits(totalAllocation, 18)} tokens`);
  console.log('');

  // Histogram buckets (in tokens)
  const buckets = [
    { min: 0n, max: 1000n, label: '< 1,000 tokens' },
    { min: 1000n, max: 5000n, label: '1,000 - 5,000 tokens' },
    { min: 5000n, max: 10000n, label: '5,000 - 10,000 tokens' },
    { min: 10000n, max: 100000n, label: '10,000 - 100,000 tokens' },
    { min: 100000n, max: 250000n, label: '100,000 - 250,000 tokens' },
    { min: 250000n, max: BigInt(Number.MAX_SAFE_INTEGER), label: '> 250,000 tokens' },
  ];

  console.log('HISTOGRAM BY ALLOCATION SIZE');
  console.log('-'.repeat(60));

  for (const bucket of buckets) {
    const minWei = bucket.min * 10n ** 18n;
    const maxWei = bucket.max * 10n ** 18n;

    const inBucket = allocations.filter(a => a.allocation >= minWei && a.allocation < maxWei);
    const count = inBucket.length;
    const totalInBucket = inBucket.reduce((sum, a) => sum + a.allocation, 0n);
    const pct = ((count / totalParticipants) * 100).toFixed(1);

    console.log(`${bucket.label.padEnd(25)}: ${count.toString().padStart(6)} holders (${pct.padStart(5)}%) - ${formatUnits(totalInBucket, 18)} tokens`);
  }

  console.log('');
  console.log('FACTORY BREAKDOWN');
  console.log('-'.repeat(60));

  const factory1Allocations = allocations.filter(a => a.factory === 'atpFactory');
  const factory2Allocations = allocations.filter(a => a.factory === 'atpFactoryAuction');

  console.log(`atpFactory: ${factory1Allocations.length} ATPs`);
  console.log(`atpFactoryAuction: ${factory2Allocations.length} ATPs`);

  console.log('');
  console.log('atpFactory allocations:');
  for (const a of factory1Allocations) {
    console.log(`  ${a.beneficiary}: ${formatUnits(a.allocation, 18)} tokens`);
  }

  // Summary stats
  const allocationValues = allocations.map(a => Number(formatUnits(a.allocation, 18)));
  allocationValues.sort((a, b) => a - b);

  console.log('');
  console.log('SUMMARY STATISTICS');
  console.log('-'.repeat(60));
  console.log(`Min: ${allocationValues[0].toLocaleString()} tokens`);
  console.log(`Max: ${allocationValues[allocationValues.length - 1].toLocaleString()} tokens`);
  console.log(`Median: ${allocationValues[Math.floor(allocationValues.length / 2)].toLocaleString()} tokens`);
  console.log(`Average: ${(allocationValues.reduce((a, b) => a + b, 0) / allocationValues.length).toLocaleString()} tokens`);
}

main().catch(console.error);
