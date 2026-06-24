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

export const deactivateAccountSchema = z.object({
  confirm: z.literal('确认注销', { errorMap: () => ({ message: '请输入「确认注销」以继续' }) })
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

export const variantBatchDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一个规格')
})

export const variantBatchUpdateSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一个规格'),
  data: z.object({
    stock: z.number().int().min(0).optional(),
    priceAdjustment: z.number().optional()
  }).refine(d => Object.keys(d).length > 0, '至少修改一个字段')
})

export const productBatchDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一个商品').max(100, '一次最多删除 100 个')
})

export const categoryReorderSchema = z.array(z.object({
  id: z.number().int().positive(),
  sort: z.number().int().min(0)
})).min(1)

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

export const menuSchema = z.object({
  parentId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, '名称不能为空'),
  path: z.string().min(1, '路径不能为空'),
  icon: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  type: z.enum(['admin', 'nav']).optional()
})

export const menuUpdateSchema = z.object({
  parentId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  icon: z.string().nullable().optional(),
  sort: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  type: z.enum(['admin', 'nav']).optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')

export const menuReorderSchema = z.array(z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  sort: z.number().int().min(0)
}))

export const variantOptionSchema = z.object({
  type: z.enum(['material', 'weight', 'size', 'color']),
  value: z.string().min(1, '值不能为空'),
  sort: z.number().int().min(0).optional()
})

export const variantOptionUpdateSchema = z.object({
  value: z.string().min(1).optional(),
  sort: z.number().int().min(0).optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')

export const productVariantOptionSchema = z.object({
  type: z.enum(['material', 'weight', 'size', 'color']),
  value: z.string().min(1, '值不能为空'),
  sort: z.number().int().min(0).optional()
})

export const productVariantOptionUpdateSchema = z.object({
  value: z.string().min(1).optional(),
  sort: z.number().int().min(0).optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')

export const homeSectionSchema = z.object({
  type: z.enum(['hero', 'videos', 'product_row', 'card_grid', 'designer_grid']),
  data: z.string().min(1, '数据不能为空'),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

export const homeSectionUpdateSchema = z.object({
  data: z.string().min(1).optional(),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  type: z.enum(['hero', 'videos', 'product_row', 'card_grid', 'designer_grid']).optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')

export const homeSectionReorderSchema = z.array(z.object({
  id: z.number().int().positive(),
  sort: z.number().int().min(0)
})).min(1)

export const designConfigSchema = z.object({
  group: z.enum(['tshirt_color', 'text_palette', 'font', 'brush_color', 'brush_style']),
  name: z.string().min(1, '名称不能为空'),
  value: z.string().min(1, '值不能为空'),
  extra: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

export const designConfigUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  extra: z.string().nullable().optional(),
  sort: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
}).refine(d => Object.keys(d).length > 0, '至少修改一个字段')
