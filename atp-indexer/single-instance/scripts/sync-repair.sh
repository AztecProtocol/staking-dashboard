#!/bin/bash
# Repair the shared ponder_sync cache on an atp-indexer box. Runs ON the box; the
# indexer-sync-repair workflow pushes and invokes it via SSM.
#
# With two copies of pg installed (fixed in #140) Ponder's sync transaction was split across
# pooled connections, so a crash could commit an interval's logs or its "cached" marker without
# its blocks. A later build then fails with "Missing block N" reading the cache.
#
#   sync-repair.sh diagnose            stop the crash-looping builder, report cached logs and
#                                      transactions whose block row is missing
#   sync-repair.sh repair MIN_BAD      back up ponder_sync.intervals, then mark every block from
#                                      MIN_BAD upwards as not cached, so Ponder fetches it again
#
# Ponder stores each cached range closed, with the upper bound one past the last cached block
# ([a, last+1]), and reads them back by JSON.parse-ing the multirange text, so every range must
# stay written as [a,b]: a half-open "[a,b)" crashes it with "Expected ',' or ']'". The trim
# therefore intersects with a closed range, and the second update closes any top range a
# half-open trim left behind.
#
# The live container (atp-indexer) is not touched and keeps serving throughout.
set -euo pipefail
cd /opt/staking-dashboard-atp

psql() { docker compose exec -T local-postgres psql -U ponder -d ponder -v ON_ERROR_STOP=1 "$@"; }
CHAIN_ID="$(psql -tAc "select chain_id from ponder_sync.intervals limit 1" | tr -d '\r')"

case "${1:-}" in
diagnose)
  if [ -f docker-compose.ab.yml ]; then
    docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.ab.yml rm -sf atp-indexer-next
    rm -f docker-compose.ab.yml
  fi
  echo "chain_id=$CHAIN_ID"
  echo "--- logs with no cached block (factory-discovery logs are expected to have none and are excluded)"
  psql -c "
    with factory_addr as (
      select lower(a) as addr
      from ponder_sync.factories f,
        lateral jsonb_array_elements_text(
          case jsonb_typeof(f.factory->'address')
            when 'array' then f.factory->'address'
            else jsonb_build_array(f.factory->'address') end) a
    )
    select l.address, count(*) as logs, min(l.block_number) as first_block, max(l.block_number) as last_block
    from ponder_sync.logs l
    where not exists (select 1 from ponder_sync.blocks b where b.chain_id = l.chain_id and b.number = l.block_number)
      and lower(l.address) not in (select addr from factory_addr)
    group by l.address order by first_block;"
  echo "--- transactions with no cached block"
  psql -c "
    select count(*) as txs, min(t.block_number) as first_block, max(t.block_number) as last_block
    from ponder_sync.transactions t
    where not exists (select 1 from ponder_sync.blocks b where b.chain_id = t.chain_id and b.number = t.block_number);"
  echo "--- cached range per fragment"
  psql -c "select upper(blocks) - 1 as cached_to, count(*) as fragments from ponder_sync.intervals group by 1 order by 1;"
  echo
  echo "MIN_BAD = the lowest first_block above. Then run: $0 repair MIN_BAD"
  ;;
repair)
  MIN_BAD="${2:?usage: $0 repair MIN_BAD}"
  [[ "$MIN_BAD" =~ ^[0-9]+$ ]] || { echo "MIN_BAD must be a block number" >&2; exit 1; }
  BACKUP="ponder_sync_intervals_backup_$(date -u +%Y%m%d%H%M)"
  psql -c "
    begin;
    create table public.\"$BACKUP\" as select * from ponder_sync.intervals;
    update ponder_sync.intervals
      set blocks = blocks * nummultirange(numrange(0, $MIN_BAD, '[]'))
      where chain_id = $CHAIN_ID;
    update ponder_sync.intervals
      set blocks = blocks + nummultirange(numrange(upper(blocks), upper(blocks), '[]'))
      where chain_id = $CHAIN_ID and not isempty(blocks) and not upper_inc(blocks);
    commit;"
  echo "intervals trimmed below block $MIN_BAD (backup: public.\"$BACKUP\")"
  psql -c "select upper(blocks) - 1 as cached_to, count(*) as fragments from ponder_sync.intervals group by 1 order by 1;"
  ;;
*)
  echo "usage: $0 diagnose | repair MIN_BAD" >&2; exit 1 ;;
esac
