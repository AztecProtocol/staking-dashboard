import path from 'path';

/**
 * Ponder creates its Postgres pool with its own `pg`, and Drizzle only checks out a single
 * connection for a transaction when `client instanceof Pool` holds for Drizzle's `pg`. With two
 * copies of `pg` installed the check fails, BEGIN and SAVEPOINT run on different pooled
 * connections, and Ponder crashes at startup with "RELEASE SAVEPOINT can only be used in
 * transaction blocks". Tests run on PGlite, which has no pool, so only this check catches it.
 */
describe('dependencies', () => {
  it('ponder and drizzle-orm share one pg', () => {
    const root = path.resolve(__dirname, '../..');
    const resolveFrom = (pkg: string) =>
      require.resolve('pg', { paths: [path.join(root, 'node_modules', pkg)] });

    const fromPonder = resolveFrom('ponder');
    const fromDrizzle = resolveFrom('drizzle-orm');
    expect(fromDrizzle).toBe(fromPonder);

    const { Pool: PonderPool } = require(fromPonder);
    const { Pool: DrizzlePool } = require(fromDrizzle);
    expect(new PonderPool()).toBeInstanceOf(DrizzlePool);
  });
});
