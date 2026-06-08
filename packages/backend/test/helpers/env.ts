// Test environment variables. Loaded as the FIRST preload so that any
// subsequently-imported module (which may have its own hoisted imports
// triggering db/config initialization) sees these values.
//
// This file MUST NOT contain any `import` statement: ESM hoists imports
// before the module body runs, which would race with the env mutation.

process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
process.env.DATA_DIR = '/tmp/cshop-test-data'
process.env.UPLOAD_DIR = '/tmp/cshop-test-data/uploads'
process.env.STICKER_DIR = '/tmp/cshop-test-data/stickers'
process.env.BACKUP_DIR = '/tmp/cshop-test-data/backups'
process.env.RATE_LIMIT_DISABLED = '1'
