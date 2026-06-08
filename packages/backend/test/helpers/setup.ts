// Re-exports for tests that want direct access to the test db.
// Lifecycle hooks live in preload.ts; this module is now just a
// thin convenience layer.
export { db } from '../../src/db'
