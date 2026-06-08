import { cors as honoCors } from 'hono/cors'
import { config } from '../config'

// In production set CORS_ORIGINS=https://app.example.com,https://admin.example.com
// to constrain origins. Default '*' is fine for dev only.
const origins = config.corsOrigins
const useWildcard = origins.length === 1 && origins[0] === '*'

export const cors = honoCors({
  origin: useWildcard ? '*' : origins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: !useWildcard
})
