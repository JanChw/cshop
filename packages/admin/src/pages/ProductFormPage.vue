<template>
  <div class="p-6 flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-text-primary">{{ isEdit ? '编辑商品' : '新增商品' }}</h1>
      <div class="flex items-center gap-3">
        <button
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
          @click="$router.back()"
        >
          取消
        </button>
        <button class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          保存
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <div class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-5">
        <h2 class="text-base font-semibold text-text-primary">基本信息</h2>

        <div class="flex gap-6">
          <div class="flex-1 flex flex-col gap-2">
            <label class="text-sm font-medium text-text-primary">商品名称</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入商品名称"
              class="h-10 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <label class="text-sm font-medium text-text-primary">商品分类</label>
            <select
              v-model="form.category"
              class="h-10 rounded border border-border px-3 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
            >
              <option value="">请选择分类</option>
              <option value="服装">服装</option>
              <option value="鞋类">鞋类</option>
              <option value="配饰">配饰</option>
            </select>
          </div>
        </div>

        <div class="flex gap-6">
          <div class="flex-1 flex flex-col gap-2">
            <label class="text-sm font-medium text-text-primary">销售价格</label>
            <input
              v-model="form.price"
              type="text"
              placeholder="¥ 0.00"
              class="h-10 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <label class="text-sm font-medium text-text-primary">库存数量</label>
            <input
              v-model="form.stock"
              type="number"
              placeholder="0"
              class="h-10 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <label class="text-sm font-medium text-text-primary">商品状态</label>
            <select
              v-model="form.status"
              class="h-10 rounded border border-border px-3 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
            >
              <option value="上架">上架</option>
              <option value="下架">下架</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-text-primary">商品描述</h2>
        <textarea
          v-model="form.description"
          placeholder="请输入商品描述信息..."
          class="h-40 rounded border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-text-primary">商品图片</h2>
        <div class="flex gap-4">
          <div
            v-for="(img, i) in images"
            :key="i"
            class="w-[160px] h-[160px] rounded border border-dashed border-primary bg-[#F9FAFB] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors relative group"
          >
            <img
              v-if="img"
              :src="img"
              class="absolute inset-0 w-full h-full object-cover rounded"
            />
            <template v-if="!img">
              <span class="text-2xl text-text-muted">+</span>
              <span class="text-xs text-text-muted">上传图片</span>
            </template>
            <button
              v-if="img"
              class="absolute top-1 right-1 w-6 h-6 rounded bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="removeImage(i)"
            >
              ×
            </button>
            <input
              type="file"
              accept="image/*"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="(e) => handleImageUpload(e, i)"
            />
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <div>
          <h2 class="text-base font-semibold text-text-primary">规格管理</h2>
          <p class="text-sm text-text-muted mt-1">添加规格可让商品支持多种组合（如尺码、颜色）</p>
        </div>

        <div class="bg-[#F9FAFB] border border-border rounded px-5 py-4 flex flex-col gap-3">
          <span class="text-sm font-semibold text-text-primary">批量生成规格</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-primary">尺寸：</span>
            <span
              v-for="size in sizes"
              :key="size"
              class="h-8 rounded border px-3 text-sm font-medium flex items-center cursor-pointer transition-colors"
              :class="selectedSizes.includes(size)
                ? 'bg-primary text-white border-primary hover:bg-primary-dark'
                : 'bg-white text-text-primary border-border hover:bg-gray-200 hover:border-gray-300'"
              @click="toggleSize(size)"
            >
              {{ size }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-primary">颜色：</span>
            <span
              v-for="color in colors"
              :key="color"
              class="h-8 rounded border px-3 text-sm font-medium flex items-center cursor-pointer transition-colors"
              :class="selectedColors.includes(color)
                ? 'bg-primary text-white border-primary hover:bg-primary-dark'
                : 'bg-white text-text-primary border-border hover:bg-gray-200 hover:border-gray-300'"
              @click="toggleColor(color)"
            >
              {{ color }}
            </span>
          </div>
          <button
            class="self-start h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            @click="batchGenerate"
          >
            批量生成规格
          </button>
        </div>

        <div class="border border-border rounded overflow-hidden">
          <div class="flex items-center px-5 bg-[#F9FAFB] h-12 gap-3">
            <span class="w-[100px] text-sm font-semibold text-text-primary">尺寸</span>
            <span class="w-[100px] text-sm font-semibold text-text-primary">颜色</span>
            <span class="w-[120px] text-sm font-semibold text-text-primary">材质</span>
            <span class="w-[100px] text-sm font-semibold text-text-primary">重量</span>
            <span class="w-[120px] text-sm font-semibold text-text-primary">价格调整</span>
            <span class="w-[100px] text-sm font-semibold text-text-primary">库存</span>
            <span class="w-[120px] text-sm font-semibold text-text-primary">操作</span>
          </div>
          <div
            v-for="(v, i) in variants"
            :key="i"
            class="flex items-center px-5 h-[52px] border-b border-border gap-3"
          >
            <span class="w-[100px] text-sm text-text-primary">{{ v.size }}</span>
            <span class="w-[100px] text-sm text-text-primary">{{ v.color }}</span>
            <span class="w-[120px] text-sm text-text-muted">{{ v.material || '-' }}</span>
            <span class="w-[100px] text-sm text-text-muted">{{ v.weight || '-' }}</span>
            <span class="w-[120px] text-sm text-text-primary">{{ v.priceAdj }}</span>
            <span class="w-[100px] text-sm text-text-primary">{{ v.stock }}</span>
            <div class="w-[120px] flex items-center gap-3">
              <button
                class="text-sm text-primary hover:underline"
                @click="openEditVariant(i)"
              >
                编辑
              </button>
              <button
                class="text-sm text-danger hover:underline"
                @click="deleteVariant(i)"
              >
                删除
              </button>
            </div>
          </div>
          <div v-if="variants.length === 0" class="flex items-center justify-center h-20 text-sm text-text-muted">
            暂无规格，点击下方按钮添加
          </div>
        </div>

        <button
          class="self-start h-10 rounded border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          @click="openAddVariant"
        >
          + 添加规格
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="variantModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="variantModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-white rounded-md w-[560px] border border-border p-7 flex flex-col gap-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-text-primary">
                {{ editingVariantIndex >= 0 ? '编辑规格' : '新增规格' }}
              </h3>
              <button
                class="w-8 h-8 rounded flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
                @click="variantModalVisible = false"
              >
                ×
              </button>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex gap-4">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">尺寸</label>
                  <input
                    v-model="variantForm.size"
                    type="text"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">颜色</label>
                  <input
                    v-model="variantForm.color"
                    type="text"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">材质</label>
                  <input
                    v-model="variantForm.material"
                    type="text"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">重量</label>
                  <input
                    v-model="variantForm.weight"
                    type="text"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">价格调整</label>
                  <input
                    v-model="variantForm.priceAdj"
                    type="text"
                    placeholder="¥0"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">库存</label>
                  <input
                    v-model.number="variantForm.stock"
                    type="number"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="variantModalVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                @click="saveVariant"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div
          v-if="deleteModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="deleteModalVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-white rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
            <h3 class="text-base font-semibold text-text-primary">确认删除</h3>
            <p class="text-sm text-text-muted">
              确定要删除规格
              <span v-if="deletingVariantIndex >= 0" class="font-medium text-text-primary">
                {{ variants[deletingVariantIndex]?.size }} / {{ variants[deletingVariantIndex]?.color }}
              </span>
              吗？此操作不可撤销。
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="deleteModalVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
                @click="confirmDelete"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  category: '',
  price: '',
  stock: '',
  status: '上架',
  description: '',
})

const images = ref<(string | null)[]>([null, null, null])

function handleImageUpload(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    images.value[index] = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeImage(index: number) {
  images.value[index] = null
}

const sizes = ['S', 'M', 'L', 'XL', 'XXL']
const colors = ['红色', '蓝色', '黑色', '白色', '绿色']
const selectedSizes = ref<string[]>(['S', 'M', 'L', 'XL', 'XXL'])
const selectedColors = ref<string[]>(['红色', '蓝色', '黑色', '白色', '绿色'])

function toggleSize(size: string) {
  const idx = selectedSizes.value.indexOf(size)
  if (idx >= 0) selectedSizes.value.splice(idx, 1)
  else selectedSizes.value.push(size)
}

function toggleColor(color: string) {
  const idx = selectedColors.value.indexOf(color)
  if (idx >= 0) selectedColors.value.splice(idx, 1)
  else selectedColors.value.push(color)
}

interface Variant {
  size: string
  color: string
  material: string
  weight: string
  priceAdj: string
  stock: number
}

const variants = ref<Variant[]>([
  { size: 'S', color: '红色', material: '', weight: '', priceAdj: '¥0', stock: 50 },
  { size: 'S', color: '蓝色', material: '', weight: '', priceAdj: '¥0', stock: 45 },
  { size: 'M', color: '红色', material: '', weight: '', priceAdj: '¥0', stock: 60 },
  { size: 'M', color: '黑色', material: '', weight: '', priceAdj: '¥0', stock: 55 },
])

const variantModalVisible = ref(false)
const deleteModalVisible = ref(false)
const deletingVariantIndex = ref(-1)
const editingVariantIndex = ref(-1)
const variantForm = reactive({
  size: '',
  color: '',
  material: '',
  weight: '',
  priceAdj: '¥0',
  stock: 0,
})

function resetVariantForm() {
  variantForm.size = ''
  variantForm.color = ''
  variantForm.material = ''
  variantForm.weight = ''
  variantForm.priceAdj = '¥0'
  variantForm.stock = 0
}

function openAddVariant() {
  editingVariantIndex.value = -1
  resetVariantForm()
  variantModalVisible.value = true
}

function openEditVariant(index: number) {
  editingVariantIndex.value = index
  const v = variants.value[index]
  variantForm.size = v.size
  variantForm.color = v.color
  variantForm.material = v.material
  variantForm.weight = v.weight
  variantForm.priceAdj = v.priceAdj
  variantForm.stock = v.stock
  variantModalVisible.value = true
}

function saveVariant() {
  if (!variantForm.size || !variantForm.color) return
  const data: Variant = {
    size: variantForm.size,
    color: variantForm.color,
    material: variantForm.material,
    weight: variantForm.weight,
    priceAdj: variantForm.priceAdj,
    stock: variantForm.stock,
  }
  if (editingVariantIndex.value >= 0) {
    variants.value[editingVariantIndex.value] = data
  } else {
    variants.value.push(data)
  }
  variantModalVisible.value = false
}

function deleteVariant(index: number) {
  deletingVariantIndex.value = index
  deleteModalVisible.value = true
}

function confirmDelete() {
  if (deletingVariantIndex.value >= 0) {
    variants.value.splice(deletingVariantIndex.value, 1)
  }
  deleteModalVisible.value = false
  deletingVariantIndex.value = -1
}

function batchGenerate() {
  if (selectedSizes.value.length === 0 || selectedColors.value.length === 0) return
  variants.value = []
  for (const size of selectedSizes.value) {
    for (const color of selectedColors.value) {
      variants.value.push({
        size,
        color,
        material: '',
        weight: '',
        priceAdj: '¥0',
        stock: 0,
      })
    }
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
