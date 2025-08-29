// Re-export from the new connection pool manager
export { db, checkDatabaseHealth, getDatabaseStats, shutdownDatabase } from './database/connection-pool';