import { Hono } from 'hono'
import { cors } from './middleware/cors'
import { logger } from './middleware/logger'
import { tracker } from './middleware/tracker'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import designRoutes from './routes/designs'
import designDraftRoutes from './routes/design-drafts'
import uploadRoutes from './routes/uploads'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import adminRoutes from './routes/admin'
import { stickerRoutes } from './routes/stickers'
import userStickerRoutes from './routes/user-stickers'
import { categoryRoutes } from './routes/categories'
import menuRoutes from './routes/menus'
import homeRoutes from './routes/home'
import designConfigRoutesPublic from './routes/design-config'
import { variantOptionsRoutes, adminVariantOptionsRoutes } from './routes/variantOptions'

export function createApp() {
  const app = new Hono()

  app.onError(errorHandler)
  app.use('*', cors)
  app.use('*', logger)
  app.use('*', tracker)

  app.route('/api/v1/auth', authRoutes)
  app.route('/api/v1/products', productRoutes)
  app.route('/api/v1/designs', designRoutes)
  app.route('/api/v1/design-drafts', designDraftRoutes)
  app.route('/api/v1/uploads', uploadRoutes)
  app.route('/api/v1/cart', cartRoutes)
  app.route('/api/v1/orders', orderRoutes)
  app.route('/api/v1/admin', adminRoutes)
  app.route('/api/v1/stickers', stickerRoutes)
  app.route('/api/v1/categories', categoryRoutes)
  app.route('/api/v1/menus', menuRoutes)
  app.route('/api/v1/variant-options', variantOptionsRoutes)
  app.route('/api/v1/home-sections', homeRoutes)
  app.route('/api/v1/user/stickers', userStickerRoutes)
  app.route('/api/v1/design-configs', designConfigRoutesPublic)

  app.get('/api/v1/health', (c) => {
    return c.json({ success: true, data: { status: 'ok' }, error: null })
  })

  return app
}
