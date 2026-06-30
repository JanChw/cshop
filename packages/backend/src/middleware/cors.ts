import { cors as honoCors } from 'hono/cors'
import { config, isProd } from '../config'

// In production CORS_ORIGINS MUST be set explicitly — a wildcard is rejected
// to prevent arbitrary sites from calling the API. Default '*' is fine for
// dev only.
const origins = config.corsOrigins
const useWildcard = origins.length === 1 && origins[0] === '*'

if (isProd() && useWildcard) {
  console.error('[security] CORS_ORIGINS not set in production — refusing to start with wildcard CORS. Set CORS_ORIGINS=https://your-site.example.com')
  process.exit(1)
}

export const cors = honoCors({
  origin: useWildcard ? '*' : origins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: !useWildcard
})
