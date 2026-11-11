import { AsyncLocalStorage } from 'node:async_hooks';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Keep the same injection token as the original platform deployment.
export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
export type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export const databaseContext = new AsyncLocalStorage<PostgresJsDatabase>();

// Nest services are shared, but each query must use its own request's client.
export const requestDatabase = new Proxy({} as PostgresJsDatabase, {
  get(_target, property) {
    const database = databaseContext.getStore();
    // Nest inspects lifecycle hooks and "then" while constructing providers.
    if (!database) return undefined;
    const value = Reflect.get(database, property);
    return typeof value === 'function' ? value.bind(database) : value;
  },
});
