import { z } from 'zod'
import { getInt } from '../utils/settings'

export const phoneRegex = /^1[3-9]\d{9}$/

// Read the configured minimum password length at validation time so admins
// can raise the floor via settings without a code change. Default 8 matches
// the DEFAULTS in routes/admin/settings.ts.
function passwordField () {
  return z.string().superRefine((val, ctx) => {
    const min = getInt('min_password_length', 8)
    if (val.length < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        type: 'string',
        minimum: min,
        inclusive: true,
        message: `密码至少 ${min} 位`
      })
    }
  })
}

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: passwordField(),
  name: z.string().min(1, '名称不能为空')
})

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
  rememberMe: z.boolean().optional().default(true)
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
  previewImage: z.string().nullable().optional(),
  isPublic: z.boolean().optional()
})

export const cartSchema = z.object({
  productId: z.number(),
  designId: z.number().nullable().optional(),
  variantId: z.number().nullable().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().int().min(1)
})

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(1)
})

export const orderSchema = z.object({
  address: z.string().min(1, '地址不能为空')
})

export const designDraftSchema = z.object({
  productId: z.number(),
  variantId: z.number().nullable().optional(),
  name: z.string().optional(),
  canvasData: z.string().min(1),
  previewImage: z.string().nullable().optional()
})

export const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  categoryId: z.number().optional(),
  images: z.array(z.string()).optional(),
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
  newPassword: passwordField()
})

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  avatar: z.string().optional(),
  phone: z.string().regex(phoneRegex, '手机号格式不正确').optional(),
  bio: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z.string().optional()
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确')
})

export const sendPhoneCodeSchema = z.object({
  phone: z.string().regex(phoneRegex, '手机号格式不正确')
})

export const bindPhoneSchema = z.object({
  phone: z.string().regex(phoneRegex, '手机号格式不正确'),
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字')
})

export const sendEmailCodeSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  captchaToken: z.string().min(1, '人机验证未通过')
})

export const emailCodeLoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字')
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
