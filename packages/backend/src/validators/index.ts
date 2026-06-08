import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '名称不能为空')
})

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken 不能为空')
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken 不能为空')
})

export const designSchema = z.object({
  productId: z.number(),
  variantId: z.number().nullable().optional(),
  name: z.string().min(1),
  canvasData: z.string().min(1),
  previewImage: z.string().nullable().optional()
})

export const cartSchema = z.object({
  productId: z.number(),
  designId: z.number().nullable().optional(),
  variantId: z.number().nullable().optional(),
  quantity: z.number().int().min(1)
})

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(1)
})

export const orderSchema = z.object({
  address: z.string().min(1, '地址不能为空')
})

export const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  categoryId: z.number().optional(),
  image: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

export const productVariantSchema = z.object({
  size: z.string().min(1),
  color: z.string().optional(),
  material: z.string().optional(),
  weight: z.number().int().positive('重量必须大于0').optional(),
  priceAdjustment: z.number().default(0),
  stock: z.number().int().min(0).default(0)
})

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']),
  trackingNo: z.string().optional()
})

export const categorySchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  slug: z.string().min(1, '标识不能为空')
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, '新密码至少 6 位')
})

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('邮箱格式不正确').optional()
}).refine(d => d.name !== undefined || d.email !== undefined, '至少修改一个字段')

export const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确')
})
