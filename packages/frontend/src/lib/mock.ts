import type { Product, CartItem, Order, User, DesignDraft } from './types'

export const mockUser: User = {
  id: 'u1',
  name: '陈小周',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXCBwssGe-nsT__IhXnIu4UtfnPy12m8VS3XLS_-O-sOvwCw74FJGHkrG5bU3yzyze7A59HE9t1x9-z-5x5rWwA2RZ7iWwwRP8OmzM1nAgHmLqrZBWO_S7QA9Ci4Sq0e4XEsTfSV5tlW8fADA8SG-ht1FgsevRFcnkl14olqe5gdw2Z0-NFXXL1cLg1IYt5MilzsBGA9Eyj7Ny7pvEVVw4eJlCGEwzhzbT638oJ8Hur3wYkVxGiTuSOvdud7jczu1COJNoTaNh0Ro',
  level: 4,
  title: '高级定制设计师 · Creator',
  stats: { designs: 24, orders: 12, likes: 156, points: 890 }
}

export const mockProducts: Product[] = [
  {
    id: 'p6',
    name: '重磅基础圆领T恤',
    price: 299,
    category: '核心系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcxIOEDbuvm6JLHMJfWZm5Xw2gobOffrSP8fYAedNZBy0mQoJa4JeRax-IgFJHtFi-bdYHnzNUVyIwNLd5dr8nDLF9fHZTOyVlfj8Ynv0m3YyLW8U_LFQnY6JQ_So2sDETtiXAF8qOsNY0lwrvoQ8FApBAdAdAvhwfuMr0b1dDPzTpgOWVjDhzQuxbc8pyKA1SuZ9IlJLOkELEU_hfGCI2FQKXlNSVKwKzpboiUmn2FCwUBCeIZFq3WlabWC6l_w_h6wrR1YSEQpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['白色', '黑色', '灰色']
  },
  {
    id: 'p7',
    name: '全棉连帽卫衣',
    price: 589,
    category: '核心系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtLq-C1TDSMoNwcHnn-eVcvKG5bW9qcDnSLkENuOUd4p63l9lIRGw6y7Wf2lHWQL5XUCi9oK2vNCP--Ic_P2z6G166x5hIOuYFR4TwWQvHA1WGCHgWCP6CBhQwnn9plpjCKuhrAmD3_JxM1YiUhe7GNScFK9wDxoZT_y41Na-WAQ9fFQ8M2AcvwJT9miQidD1BomvhU3bNKvMPn9kk2EGUlH6ezxfZOkKtwVYWP-j2SyoLx-rYb25fUEFO8mEc59lqo3w6xO8scPo',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['炭灰色', '白色']
  },
  {
    id: 'p8',
    name: '艺术家合作款短袖',
    price: 899,
    category: '设计师款',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIcHDcQdljht2z6gQ41gLuV1ojUjxwy4bWFh89z7xckp-OdCE8P_WwuiQDxwhven813Q6WUo6kkIS1OpvtrkCUZkxmPNxNXm7vCbJSm-Js7LuoQbcbXDvW6N947AlmRD_8-BEEPZKVskrV82GLkj2iAb2ijj__zUOlsa6-Av40EiCaJ6cxj2CVCJIIGXbZYI3XnmGpoK2-s5C0ZSuoyH5IcqMe7yLP9eJ_fJRib-sEsZz7RbxZH9OX9bFhe2S4t2Corz34yCM0x-Q',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['黑色', '白色'],
    designer: 'Alex Chen'
  },
  {
    id: 'p9',
    name: '手工水洗丹宁夹克',
    price: 1299,
    category: '定制款',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMSwZyZ4zLPPjxJ1sMCKcHLY9aFmf7BNfeLbsA0brfMz-guyQOf_bLuoTAn8aFg1f942gafBVLPDrHa8xeMmsUUnbXzRnpcMSIHLu2ebCGI5eOifptXsd8GWVoq9U6ZF3wl9vH1YRiQxU7HFs4hMdJXsBV0hpsBhPTK1idjNh2EcM0gnyNb7HDsOWC0sJ0oyNDFNbusKmIm4ZEIIlpniis74rgbyxxI2SgM_90nWNG7S-fijzaHI66htva8j7ZbPPpf7EXIWIqxrY',
    sizes: ['M', 'L', 'XL'],
    colors: ['深蓝色'],
    tags: ['New']
  },
  {
    id: 'p10',
    name: '莫代尔混纺T恤',
    price: 349,
    category: '核心系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpuaD8FazEBJOA0_62jqtProQd1eCNt-azH7UUcjreol2d57cYmNiSGD8VIwJ4e8NLrA4kZAEKJgzKDbOi4dVB8ZYN_DDKnqTdNAmq3dFZj_-FOlRhh3Q0SD0_uFMDaohyalYYLLuE6b_k9Iev9MBbc-0hd7xDqs8m8HnBI00hon-AMqPR4fDvtFE3BKFCmR_qS6eQTMVdngHgHmHka0A64QV5ECRqrSdGucWF4elY0uLveyOahqeBvA4QzXdjXdTMMdWFaQ7d4_c',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['黑色', '白色']
  },
  {
    id: 'p11',
    name: '廓形立领衬衫',
    price: 749,
    category: '设计师款',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0A3aMuC4cizuVAd7icLzj9LidBydEL6nDBh0YmU2Du4OBFwbETf59UNSN2MpWy4KsYb_pCHNVzSdqD7u_zqt3wX-PLYuplbYw4BfehrC8IHaOIyH7zWaiM4gCzhMnRjKYy2Cy-DviIo_RALbHLGO2EfksZlQ4KWCCOy0ikRmoqkqVtTR_gBCIG9TjATmU16zSbb6_k2_69KTgcPHywTI53AAD-FTCwG9fa6vOwUklgcasGfxkXJOMXmIJjoxolnKjpD6H7vDtnWU',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['白色', '米色'],
    designer: 'Li Wei'
  },
  {
    id: 'p1',
    name: '定制创意印花 T恤',
    price: 199,
    originalPrice: 299,
    category: '基础系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIhzLzAmSg7tIVqz1NRb2UC1ThtwDrTvmbXuwTf4e90dRROxxIYgM9yLcLVYw-m_1FbGpJgYmZCErL4xkaVI7grMWcmxi5ihCv3V-c3to5HBOzbQQO1-vLVrX7c7QozTA_qDDn3_Tc_CBpHeAMCU_WWgpU_AmBTFrUayJr1DINoQhb0NUqIW2lh8DBSAfS8HviVNAU2m9tBbAoRw5ROMBmVWKtdwDbaO8FNxZ-DNJ-vz5JDGSumieTybJprExQlQqWsDGzHi5YyeU',
    description: '采用 100% 高品质精梳棉，手感柔软亲肤。支持多区域个性化定制，让你的创意灵感跃然衣上。',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['白色', '黑色', '灰色'],
    tags: ['Canvas Ready'],
    designer: 'Jordan.Design'
  },
  {
    id: 'p2',
    name: '重磅廓形圆领衫',
    price: 199,
    category: '基础系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIhzLzAmSg7tIVqz1NRb2UC1ThtwDrTvmbXuwTf4e90dRROxxIYgM9yLcLVYw-m_1FbGpJgYmZCErL4xkaVI7grMWcmxi5ihCv3V-c3to5HBOzbQQO1-vLVrX7c7QozTA_qDDn3_Tc_CBpHeAMCU_WWgpU_AmBTFrUayJr1DINoQhb0NUqIW2lh8DBSAfS8HviVNAU2m9tBbAoRw5ROMBmVWKtdwDbaO8FNxZ-DNJ-vz5JDGSumieTybJprExQlQqWsDGzHi5YyeU',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['白色', '黑色']
  },
  {
    id: 'p3',
    name: '极简连帽卫衣',
    price: 399,
    category: '基础系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIsef-278svTdwey7G-NT7fIg-9RWYm5SMggeQw4SNb6gCWypvMF2J272nYbplsxPA9NFnj6vnGpvHz525IK1p2ZyMfxxCjevTOBU29k6Hs5q1mdRgdTm7QlNdHRkgj0JWejti_qw0vRCay2CGhJ_GSYsgUOl6h3AtF8wQ5antejfTtubb6NcPPRNIyw_3223UZokC7mv0haJgJrnpRmtDQhlQHdRWLJiZvT5mn9itgmSV5ZNEpLtazpnLoV53flRiUQvMC1Im9_8',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['炭灰色', '白色']
  },
  {
    id: 'p4',
    name: '阔腿束口短裤',
    price: 159,
    category: '基础系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYT0hrOuPkQJk7o3T466tR8B78FKGFuUJfsWMhYacVinNF2muf9LQIkmglCm9RmlVgzgdXkFcTIy4CMnnd0jk2Je5UGO1uqOhByskjWPlKJuB4KBcsLvPQxIMUKvWWtzEe1sAe9sLGqoRxlgIldMTG4eAlMBszrIpy0qhER46RAj5uka9HpypxIAT7oG_Y5GMriyJf6oGnfhVl9EI7dgAkJjnBuf_iPo_k-9_ERM0sioukh5_hQbok_gyp8zLs4Pa0SRjGivwUnH8',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['卡其色', '黑色']
  },
  {
    id: 'p5',
    name: '精梳棉长袖',
    price: 249,
    category: '基础系列',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC30_KKxDv8V2Lt2IbvSC1AV61u5SyN56iBUOUGChoxOHDOnMNfyDGHB9_uhaeAczMf78tbZ_wPy1SFudV3xtajvj5kXfN8glhCEdi2GdtDgYPz-te3ltSqc3U4RK86PNTucAkyyObOmrZ4pAOyR1FN16ebfwnQipgrK6c5Ruxs_qUEqK13O_FO8KUkufG-8c2YifV3hBX_7TlWDdVLzly4Qr-uFzYnqW0PhXCmxGXWEMEXbM-kj5rL3lkg-3fItVSbjYAvUiu4Csc',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['白色', '米色']
  }
]

export const mockCartItem1: CartItem = {
  id: 'ci1',
  product: mockProducts[0],
  quantity: 1,
  size: 'L',
  color: '白色',
  designId: 'BYCH-8821'
}

export const mockCartItem2: CartItem = {
  id: 'ci2',
  product: mockProducts[6],
  quantity: 1,
  size: 'XL',
  color: '炭灰色'
}

export const mockCartItem3: CartItem = {
  id: 'ci3',
  product: { id: 'p12', name: '简约概念帆布袋', price: 88, category: '配饰', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJfFaQ9TvHgxrJqqwM4t7BuNTpTYsYxksPghN9AxacWpYoxSfGYAKKSYFBRPPQmpZVA3icG2Az_0F9NHXyj3mbu1zaV36BZ9iY1EWlXWR1Z-WsNmlsCgYTmAqDUll-2NLlUJvdYU_RMPRAkvliJqbZeVaigYsk_gpDJ6-36iRA3TVI1bN9gUsGt0jhAy_AiQYf51j6iOcKcQ5wN7nDXVG1NJsfxetgFrY21tPag9ISkPg6VtYTkfcABEpUXEWuIt4IDRkImavLpw' },
  quantity: 1,
  size: '均码',
  color: '黑色'
}

export const mockCartItems: CartItem[] = [mockCartItem1, mockCartItem2, mockCartItem3]

export const mockOrders: Order[] = [
  {
    id: 'o1',
    orderNumber: '202310248892',
    items: [{ product: mockProducts[0], quantity: 1, size: 'L', color: '极简黑' }],
    status: 'pending',
    total: 199,
    createdAt: '2023-10-24',
    designer: 'Jordan.Design'
  },
  {
    id: 'o2',
    orderNumber: '202310224510',
    items: [{ product: mockProducts[6], quantity: 1, size: 'XL', color: '霜灰色' }],
    status: 'shipping',
    total: 459,
    createdAt: '2023-10-22',
    designer: 'Studio_99',
    trackingNumber: 'SF1234567890',
    carrier: '顺丰速运'
  },
  {
    id: 'o3',
    orderNumber: '202309153321',
    items: [{ product: mockProducts[1], quantity: 1, size: 'M', color: '珍珠白' }],
    status: 'completed',
    total: 229,
    createdAt: '2023-09-15'
  }
]

export const mockDesigns: DesignDraft[] = [
  { id: 'd1', name: '极简未来主义 T-Shirt', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArNJtz5id7l_kVqDy9q77UDFa00Qmzx3dTObH430lfddSQGRdF8NT40Hv-0ldAnftfKTRvMENRa_O4Y_s9Kyfw98e2o6z23_egbDGk-ITD0kC7bZpxAnNoaQrpwTAX43294R1EUTtY4DzTqrCZTPTHdpN837UjKudvw2iCyvFQ5ETWJFcHZtBVMrBJUB7dzTjjOIWwDYNAkbq1qfc2ZwNNCs26Zqvdp8WqNA9o2XcchdyWNVIx9Z1RqnRmCKytw56xNKD4oizaBOg', status: 'draft' },
  { id: 'd2', name: '朋克复兴 Hoodie', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmdqsm1mnUTfH9dcXkf9lg2yAIUNE4haQRM1C7WXGjGLMuLJl4R9KbALdejGBBJ4fVTA29Xa8orLBbj37TXn_J4TIXkxBFddSyDnAG9NpXETZwj1gPzUKl1giPhtGTXfHYqVMajmBurVJbmkeioPdLUa-HXTuVVRpof34peFEeE_QiMCfxSHRiOnbs9YKWi_2mzX0t80VklNowIOwQJhN5zApa4tq5CKsIIHJgyIaRvB2BxoK_z5FojTe61tQe9cOs-MoBaR5lQLo', status: 'draft' }
]
