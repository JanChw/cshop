<template>
  <div class="p-6 flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-text-primary">{{ isEdit ? '编辑商品' : '新增商品' }}</h1>
      <div class="flex items-center gap-3">
        <button
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
          @click="$router.back()"
        >
          取消
        </button>
        <button
          v-if="currentStep === 1"
          class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          :disabled="saving"
          @click="goToStep(2)"
        >
          {{ saving ? '保存中...' : '下一步' }}
        </button>
        <button
          v-else
          class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
          @click="goToStep(1)"
        >
          上一步
        </button>
        <button
          class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 px-1">
      <div
        class="flex items-center gap-2 cursor-pointer"
        @click="goToStep(1)"
      >
        <span
          class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
          :class="currentStep >= 1 ? 'bg-primary text-white' : 'bg-border text-text-muted'"
        >1</span>
        <span
          class="text-sm font-medium"
          :class="currentStep >= 1 ? 'text-text-primary' : 'text-text-muted'"
        >基本信息与规格选项</span>
      </div>
      <div class="flex-1 h-px bg-border" />
      <div
        class="flex items-center gap-2 cursor-pointer"
        @click="goToStep(2)"
      >
        <span
          class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
          :class="currentStep >= 2 ? 'bg-primary text-white' : 'bg-border text-text-muted'"
        >2</span>
        <span
          class="text-sm font-medium"
          :class="currentStep >= 2 ? 'text-text-primary' : 'text-text-muted'"
        >规格管理</span>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <div v-show="currentStep === 1" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-5">
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
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
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
            <label class="text-sm font-medium text-text-primary">库存数量（按规格汇总）</label>
            <div
              class="h-10 rounded border border-border px-3 text-sm text-text-primary bg-background flex items-center cursor-not-allowed"
              title="库存数量按规格中的库存自动汇总"
            >
              {{ totalStock }}
            </div>
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

      <div v-show="currentStep === 1" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-text-primary">规格选项管理</h2>
            <p class="text-sm text-text-muted mt-1">管理本商品可用的尺寸/颜色/材质/重量选项，下一步生成规格时使用</p>
          </div>
        </div>

        <div class="flex border-b border-border">
          <button
            v-for="opt in optionTypeDefs"
            :key="opt.type"
            class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            :class="activeOptionTab === opt.type
              ? 'text-primary border-primary'
              : 'text-text-muted border-transparent hover:text-text-primary'"
            @click="activeOptionTab = opt.type"
          >
            {{ opt.label }}
            <span
              v-if="productOptions[opt.type].filter(o => !o.isDeleted).length > 0"
              class="ml-1.5 text-xs text-text-muted"
            >({{ productOptions[opt.type].filter(o => !o.isDeleted).length }})</span>
          </button>
        </div>

        <div class="border border-border rounded px-4 py-3 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="w-20 text-sm font-medium text-text-primary whitespace-nowrap">{{ currentOptionDef.label }}</span>
            <div class="flex-1 flex items-center gap-2 flex-wrap min-h-[32px]">
              <span
                v-for="(item, i) in productOptions[activeOptionTab]"
                :key="item.id ?? `new-${i}`"
                class="h-7 rounded border px-2.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                :class="item.id == null
                  ? 'bg-primary/5 text-primary border-primary/30'
                  : 'bg-white text-text-primary border-border'"
              >
                {{ item.value }}
                <button
                  class="text-text-muted hover:text-danger transition-colors"
                  @click="removeProductOption(activeOptionTab, i)"
                >×</button>
              </span>
              <span v-if="productOptions[activeOptionTab].length === 0" class="text-xs text-text-muted">暂无</span>
            </div>
          </div>
          <div class="flex items-center gap-2 pl-[92px]">
            <input
              v-model="newOptionInputs[activeOptionTab]"
              type="text"
              :placeholder="currentOptionDef.placeholder"
              class="h-8 rounded border border-border px-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors w-32"
              @keyup.enter="addProductOption(activeOptionTab)"
            />
            <button
              class="h-8 rounded border border-primary px-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              :disabled="!newOptionInputs[activeOptionTab].trim()"
              @click="addProductOption(activeOptionTab)"
            >
              + 添加
            </button>
            <button
              v-if="productOptions[activeOptionTab].filter(o => !o.isDeleted).length > 0"
              class="h-8 rounded border border-border px-3 text-xs text-text-muted hover:text-danger hover:border-danger transition-colors"
              @click="clearProductOptions(activeOptionTab)"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <div v-show="currentStep === 1" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-text-primary">商品描述</h2>
        <textarea
          v-model="form.description"
          placeholder="请输入商品描述信息..."
          class="h-40 rounded border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div v-show="currentStep === 1" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-text-primary">商品图片</h2>
        <div class="flex gap-4">
          <div
            v-for="(img, i) in images"
            :key="i"
            class="w-[160px] h-[160px] rounded border border-dashed border-primary bg-background flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors relative group"
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

      <div v-show="currentStep === 1 && isBaseProduct" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <div>
          <h2 class="text-base font-semibold text-text-primary">底款设计图</h2>
          <p class="text-xs text-text-muted mt-1">上传原始设计图，系统将自动去除背景并生成遮罩</p>
        </div>
        <div class="flex gap-6">
          <div class="flex flex-col gap-2">
            <span class="text-xs font-medium text-text-muted">原始图片（可上传/删除）</span>
            <div
              class="w-[160px] h-[160px] rounded border border-dashed border-primary bg-background flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors relative group"
            >
              <img
                v-if="baseDesign?.originalImage"
                :src="baseDesign.originalImage"
                class="absolute inset-0 w-full h-full object-cover rounded"
              />
              <template v-if="!baseDesign?.originalImage">
                <span class="text-2xl text-text-muted">+</span>
                <span class="text-xs text-text-muted">上传图片</span>
              </template>
              <button
                v-if="baseDesign?.originalImage"
                class="absolute top-1 right-1 w-6 h-6 rounded bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="removeBaseDesign"
              >
                ×
              </button>
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleBaseDesignUpload"
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-xs font-medium text-text-muted">去除背景图（只读）</span>
            <div
              class="w-[160px] h-[160px] rounded border border-border bg-background flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="baseDesign?.frontImage"
                :src="baseDesign.frontImage"
                class="w-full h-full object-contain"
              />
              <span v-else class="text-xs text-text-muted">待生成</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-xs font-medium text-text-muted">遮罩图（只读）</span>
            <div
              class="w-[160px] h-[160px] rounded border border-border bg-background flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="baseDesign?.maskImage"
                :src="baseDesign.maskImage"
                class="w-full h-full object-contain"
              />
              <span v-else class="text-xs text-text-muted">待生成</span>
            </div>
          </div>
        </div>
      </div>

      <div v-show="currentStep === 2" class="bg-card border border-border rounded-md px-6 py-5 flex flex-col gap-4">
        <div>
          <h2 class="text-base font-semibold text-text-primary">规格管理</h2>
          <p class="text-sm text-text-muted mt-1">添加规格可让商品支持多种组合（如尺码、颜色）</p>
        </div>

        <div class="bg-background border border-border rounded px-5 py-4 flex flex-col gap-3">
          <span class="text-sm font-semibold text-text-primary">批量生成规格</span>
          <div class="flex items-center gap-2 flex-wrap">
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
          <div class="flex items-center gap-2 flex-wrap">
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

        <div v-if="selectedCount > 0" class="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/30 rounded">
          <span class="text-sm text-text-primary">已选 <span class="font-semibold text-primary">{{ selectedCount }}</span> 个规格</span>
          <button
            class="h-8 rounded border border-border px-3 text-sm text-text-primary hover:bg-gray-50 transition-colors"
            @click="selectedVariantIndexes = new Set()"
          >
            取消选择
          </button>
          <div class="flex-1" />
          <button
            class="h-8 rounded border border-primary px-3 text-sm text-primary hover:bg-primary/5 transition-colors"
            @click="openBatchUpdate"
          >
            批量更新
          </button>
          <button
            class="h-8 rounded border border-danger px-3 text-sm text-danger hover:bg-danger/5 transition-colors"
            @click="batchDeleteVariants"
          >
            批量删除
          </button>
        </div>

        <div class="border border-border rounded overflow-hidden">
          <div class="flex items-center px-5 bg-table-header h-11 gap-3">
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              :checked="allSelected"
              @change="toggleSelectAll"
            />
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
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              :checked="selectedVariantIndexes.has(i)"
              @change="toggleSelectOne(i)"
            />
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
          <div class="relative glass rounded-md w-[560px] border border-border p-7 flex flex-col gap-5">
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
                  <select
                    v-model="variantForm.size"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  >
                    <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">颜色</label>
                  <select
                    v-model="variantForm.color"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  >
                    <option v-for="c in colors" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">材质</label>
                  <select
                    v-model="variantForm.material"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  >
                    <option value="">无</option>
                    <option v-for="m in materials" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-text-primary">重量（g）</label>
                  <select
                    v-model="variantForm.weight"
                    class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                  >
                    <option value="">无</option>
                    <option v-for="w in weights" :key="w" :value="String(w)">{{ w }}g</option>
                  </select>
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
          <div class="relative glass rounded-md w-[400px] border border-border p-7 flex flex-col gap-5">
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

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="batchUpdateVisible"
          class="fixed inset-0 z-50 flex items-center justify-center"
          @click.self="batchUpdateVisible = false"
        >
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative glass rounded-md w-[480px] border border-border p-7 flex flex-col gap-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-text-primary">批量更新规格</h3>
              <button
                class="w-8 h-8 rounded flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
                @click="batchUpdateVisible = false"
              >
                ×
              </button>
            </div>
            <p class="text-sm text-text-muted">将以下字段应用到选中的 <span class="font-semibold text-primary">{{ selectedCount }}</span> 个规格，留空表示不修改</p>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">库存</label>
                <input
                  v-model="batchUpdateForm.stock"
                  type="number"
                  min="0"
                  placeholder="留空不修改"
                  class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">价格调整（¥）</label>
                <input
                  v-model="batchUpdateForm.priceAdjustment"
                  type="number"
                  placeholder="留空不修改"
                  class="h-10 rounded border border-border px-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div class="flex items-center justify-end gap-3">
              <button
                class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                @click="batchUpdateVisible = false"
              >
                取消
              </button>
              <button
                class="h-10 rounded bg-primary text-white px-4 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                :disabled="batchUpdating"
                @click="confirmBatchUpdate"
              >
                {{ batchUpdating ? '更新中...' : '确认更新' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  category: '',
  price: '',
  status: '上架',
  description: '',
})

const isBaseProduct = computed(() => true)

const images = ref<(string | null)[]>([null, null, null])
const imageFiles = ref<(File | null)[]>([null, null, null])
const baseDesign = ref<{ originalImage: string; frontImage: string; maskImage: string } | null>(null)
const categories = ref<{ id: number; name: string }[]>([])
const saving = ref(false)
const originalVariantIds = ref(new Set<number>())

async function loadCategories() {
  const res = await api.get<{ items: { id: number; name: string }[] }>('/categories')
  if (res.success && res.data) {
    categories.value = Array.isArray(res.data) ? res.data : (res.data.items || [])
  }
}

async function loadProduct() {
  const res = await api.get<{
    id: number
    name: string
    description: string
    basePrice: number
    categoryId: number
    categoryName: string
    stock: number
    isActive: boolean
    images: string[]
  }>(`/admin/products/${route.params.id}`)
  if (!res.success || !res.data) return
  const d = res.data
  form.name = d.name
  form.description = d.description
  form.price = String(d.basePrice)
  form.category = String(d.categoryId)
  form.status = d.isActive ? '上架' : '下架'
  if (d.images?.length) {
    images.value = [...d.images, null, null, null].slice(0, 3)
  }
}

async function loadBaseDesign() {
  const res = await api.get<{
    originalImage: string | null
    frontImage: string | null
    maskImage: string | null
  } | null>(`/admin/products/${route.params.id}/base-design`)
  if (res.success && res.data) {
    baseDesign.value = res.data
  }
}

async function loadVariants() {
  const res = await api.get<{ items: Array<{
    id: number
    size: string
    color: string
    material: string | null
    weight: number | null
    priceAdjustment: number
    stock: number
  }> }>(`/admin/products/${route.params.id}/variants`)
  if (!res.success || !res.data) return
  const items = Array.isArray(res.data) ? res.data : (res.data.items || [])
  originalVariantIds.value = new Set(items.map(v => v.id))
  variants.value = items.map(v => ({
    id: v.id,
    size: v.size,
    color: v.color,
    material: v.material || '',
    weight: v.weight != null ? String(v.weight) : '',
    priceAdj: v.priceAdjustment ? `¥${v.priceAdjustment}` : '¥0',
    stock: v.stock,
  }))
}

function handleImageUpload(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  imageFiles.value[index] = file
  const reader = new FileReader()
  reader.onload = (e) => {
    images.value[index] = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeImage(index: number) {
  images.value[index] = null
  imageFiles.value[index] = null
}

async function handleBaseDesignUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const fd = new FormData()
  fd.append('file', file)
  const res = await api.upload<{
    originalImage: string
    frontImage: string
    maskImage: string
  }>(`/admin/products/${route.params.id}/base-design`, fd)
  if (res.success && res.data) {
    baseDesign.value = res.data
  } else {
    toast.error(res.error || '底款设计图上传失败')
  }
}

async function removeBaseDesign() {
  const res = await api.delete(`/admin/products/${route.params.id}/base-design`)
  if (res.success) {
    baseDesign.value = null
  } else {
    toast.error(res.error || '删除失败')
  }
}

async function saveStep1(): Promise<number | null> {
  if (!form.name) {
    toast.error('请输入商品名称')
    return null
  }
  if (!form.category) {
    toast.error('请选择商品分类')
    return null
  }

  try {
    const basePrice = parseFloat(form.price.replace(/[¥\s]/g, '')) || 0
    const payload = {
      name: form.name,
      description: form.description,
      basePrice,
      categoryId: Number(form.category),
      stock: totalStock.value,
      isActive: form.status === '上架',
    }

    let productId: number
    if (isEdit.value) {
      const res = await api.put(`/admin/products/${route.params.id}`, payload)
      if (!res.success) throw new Error(res.error || '保存失败')
      productId = Number(route.params.id)
    } else {
      const res = await api.post<{ id: number }>('/admin/products', payload)
      if (!res.success || !res.data) throw new Error(res.error || '保存失败')
      productId = res.data.id
    }

    await syncProductOptions(productId)
    return productId
  } catch (err: any) {
    toast.error(err.message || '保存失败')
    return null
  }
}

async function handleSave() {
  saving.value = true
  try {
    const productId = await saveStep1()
    if (productId == null) return

    for (let i = 0; i < imageFiles.value.length; i++) {
      if (imageFiles.value[i]) {
        const fd = new FormData()
        fd.append('file', imageFiles.value[i]!)
        await api.upload(`/admin/products/${productId}/image`, fd)
      }
    }

    if (isEdit.value && originalVariantIds.value.size > 0) {
      const currentIds = new Set(
        variants.value.filter(v => v.id != null).map(v => v.id!)
      )
      for (const origId of originalVariantIds.value) {
        if (!currentIds.has(origId)) {
          await api.delete(`/admin/products/${productId}/variants/${origId}`)
        }
      }
    }

    for (const v of variants.value) {
      const vPayload = {
        size: v.size,
        color: v.color,
        material: v.material || undefined,
        weight: v.weight ? parseFloat(v.weight) : undefined,
        priceAdjustment: parseFloat(v.priceAdj.replace(/[¥\s]/g, '')) || 0,
        stock: v.stock,
      }
      if (v.id) {
        await api.put(`/admin/products/${productId}/variants/${v.id}`, vPayload)
      } else {
        await api.post(`/admin/products/${productId}/variants`, vPayload)
      }
    }

    toast.success(isEdit.value ? '商品已更新' : '商品已创建')
    if (!isEdit.value) {
      // 新建完成后跳转到编辑页，方便继续管理规格
      router.replace(`/products/${productId}/edit`)
    } else {
      router.back()
    }
  } catch (err: any) {
    toast.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const currentStep = ref<1 | 2>(Number(route.query.step) === 2 ? 2 : 1)
const activeOptionTab = ref<OptionType>('size')

async function goToStep(n: 1 | 2) {
  if (n === 2) {
    saving.value = true
    const pid = await saveStep1()
    saving.value = false
    if (pid == null) return
    if (!isEdit.value) {
      router.replace(`/products/${pid}/edit?step=2`)
      return
    }
  }
  currentStep.value = n
}

type OptionType = 'size' | 'color' | 'material' | 'weight'

interface ProductOptionItem {
  id: number | null
  value: string
  sort: number
  isNew?: boolean
  isDeleted?: boolean
}

const productOptions = reactive<Record<OptionType, ProductOptionItem[]>>({
  size: [],
  color: [],
  material: [],
  weight: []
})

const newOptionInputs = reactive<Record<OptionType, string>>({
  size: '',
  color: '',
  material: '',
  weight: ''
})

const optionTypeDefs: { type: OptionType; label: string; placeholder: string }[] = [
  { type: 'size', label: '尺寸', placeholder: '如 S' },
  { type: 'color', label: '颜色', placeholder: '如 红色' },
  { type: 'material', label: '材质', placeholder: '如 纯棉' },
  { type: 'weight', label: '重量（g）', placeholder: '如 500' }
]

const currentOptionDef = computed(() => optionTypeDefs.find(d => d.type === activeOptionTab.value)!)

function addProductOption(type: OptionType) {
  const value = newOptionInputs[type].trim()
  if (!value) return
  const exists = productOptions[type].some(o => o.value === value && !o.isDeleted)
  if (exists) {
    toast.error('该值已存在')
    return
  }
  // 如果之前被删除了，恢复
  const removed = productOptions[type].find(o => o.value === value && o.isDeleted)
  if (removed) {
    removed.isDeleted = false
  } else {
    productOptions[type].push({
      id: null,
      value,
      sort: (productOptions[type].length + 1) * 100,
      isNew: true
    })
  }
  newOptionInputs[type] = ''
}

function removeProductOption(type: OptionType, index: number) {
  const item = productOptions[type][index]
  if (item.id != null) {
    item.isDeleted = true
  } else {
    productOptions[type].splice(index, 1)
  }
}

function clearProductOptions(type: OptionType) {
  if (!confirm(`确定清空所有${optionTypeDefs.find(d => d.type === type)?.label}吗？`)) return
  productOptions[type].forEach(o => {
    if (o.id != null) o.isDeleted = true
  })
  productOptions[type] = productOptions[type].filter(o => o.id == null)
}

async function loadProductOptions() {
  if (!isEdit.value) return
  const res = await api.get<{ items: { id: number; type: OptionType; value: string; sort: number }[] }>(
    `/products/${route.params.id}/variant-options`
  )
  if (!res.success || !res.data) return
  for (const opt of optionTypeDefs) {
    productOptions[opt.type] = (res.data.items || [])
      .filter(i => i.type === opt.type)
      .map(i => ({ id: i.id, value: i.value, sort: i.sort }))
  }
}

async function syncProductOptions(productId?: number) {
  const pid = productId ?? Number(route.params.id)
  if (!Number.isFinite(pid)) return
  for (const opt of optionTypeDefs) {
    const items = productOptions[opt.type]
    // 删除标记的
    const toDelete = items.filter(i => i.isDeleted && i.id != null)
    for (const d of toDelete) {
      await api.delete(`/admin/products/${productId}/variant-options/${d.id}`)
    }
    // 新增
    const toAdd = items.filter(i => i.isNew && !i.isDeleted)
    for (const a of toAdd) {
      await api.post(`/admin/products/${productId}/variant-options`, {
        type: opt.type,
        value: a.value,
        sort: a.sort
      })
    }
  }
  // 重新拉取，让 id 落到本地
  await loadProductOptions()
}

const sizes = computed(() => productOptions.size.filter(o => !o.isDeleted).map(o => o.value))
const colors = computed(() => productOptions.color.filter(o => !o.isDeleted).map(o => o.value))
const materials = computed(() => productOptions.material.filter(o => !o.isDeleted).map(o => o.value))
const weights = computed(() => productOptions.weight.filter(o => !o.isDeleted).map(o => o.value))
const totalStock = computed(() => variants.value.reduce((sum, v) => sum + (Number(v.stock) || 0), 0))
const selectedSizes = ref<string[]>([])
const selectedColors = ref<string[]>([])

watch(sizes, (newSizes) => {
  if (newSizes.length > 0 && selectedSizes.value.length === 0) {
    selectedSizes.value = [...newSizes]
  }
}, { immediate: true })

watch(colors, (newColors) => {
  if (newColors.length > 0 && selectedColors.value.length === 0) {
    selectedColors.value = [...newColors]
  }
}, { immediate: true })

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
  id?: number
  size: string
  color: string
  material: string
  weight: string
  priceAdj: string
  stock: number
}

const variants = ref<Variant[]>([])

const selectedVariantIndexes = ref<Set<number>>(new Set())
const batchUpdateVisible = ref(false)
const batchUpdateForm = reactive({ stock: '' as string, priceAdjustment: '' as string })
const batchUpdating = ref(false)

const selectableIndexes = computed(() => variants.value.map((_, i) => i))
const allSelected = computed(() => {
  return variants.value.length > 0 && selectableIndexes.value.every(i => selectedVariantIndexes.value.has(i))
})
const selectedCount = computed(() => selectedVariantIndexes.value.size)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedVariantIndexes.value = new Set()
  } else {
    selectedVariantIndexes.value = new Set(selectableIndexes.value)
  }
}

function toggleSelectOne(index: number) {
  const next = new Set(selectedVariantIndexes.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  selectedVariantIndexes.value = next
}

function selectedVariants() {
  return Array.from(selectedVariantIndexes.value)
    .map(i => variants.value[i])
    .filter((v): v is Variant => v != null)
}

async function batchDeleteVariants() {
  const targets = selectedVariants()
  const ids = targets.map(v => v.id).filter((id): id is number => id != null)
  const localIndexes = targets.filter(v => v.id == null).map(v => variants.value.indexOf(v))
  if (ids.length === 0 && localIndexes.length === 0) return
  if (!confirm(`确定要删除选中的 ${targets.length} 个规格吗？`)) return

  if (ids.length > 0) {
    const res = await api.post<{ deleted: number; skipped: number[] }>(
      `/admin/products/${route.params.id}/variants/batch-delete`,
      { ids }
    )
    if (res.success) {
      const skipped: number[] = res.data?.skipped || []
      if (skipped.length > 0) {
        toast.error(`已删除 ${res.data?.deleted} 个，${skipped.length} 个被引用已跳过`)
      } else {
        toast.success(`已删除 ${res.data?.deleted} 个规格`)
      }
    } else {
      toast.error(res.error || '删除失败')
      return
    }
  }

  // 移除已删除的（id 匹配）和本地未保存的
  const toRemoveIndexes = new Set<number>()
  variants.value.forEach((v, i) => {
    if (v.id != null && ids.includes(v.id)) toRemoveIndexes.add(i)
    if (v.id == null && localIndexes.includes(i)) toRemoveIndexes.add(i)
  })
  const newVariants = variants.value.filter((_, i) => !toRemoveIndexes.has(i))
  // 同时更新 originalVariantIds
  originalVariantIds.value = new Set(
    Array.from(originalVariantIds.value).filter(id => !ids.includes(id))
  )
  variants.value = newVariants
  selectedVariantIndexes.value = new Set()
}

function openBatchUpdate() {
  batchUpdateForm.stock = ''
  batchUpdateForm.priceAdjustment = ''
  batchUpdateVisible.value = true
}

async function confirmBatchUpdate() {
  const targets = selectedVariants()
  const ids = targets.map(v => v.id).filter((id): id is number => id != null)
  if (ids.length === 0) {
    toast.error('批量更新仅支持已保存的规格，请先保存商品')
    return
  }
  const data: { stock?: number; priceAdjustment?: number } = {}
  if (batchUpdateForm.stock !== '') data.stock = Number(batchUpdateForm.stock)
  if (batchUpdateForm.priceAdjustment !== '') data.priceAdjustment = Number(batchUpdateForm.priceAdjustment)
  if (Object.keys(data).length === 0) {
    toast.error('请至少填写一个字段')
    return
  }
  batchUpdating.value = true
  const res = await api.post<{ updated: number }>(
    `/admin/products/${route.params.id}/variants/batch-update`,
    { ids, data }
  )
  batchUpdating.value = false
  if (res.success) {
    for (const v of targets) {
      if (v.id != null && ids.includes(v.id)) {
        if (data.stock != null) v.stock = data.stock
        if (data.priceAdjustment != null) v.priceAdj = `¥${data.priceAdjustment}`
      }
    }
    batchUpdateVisible.value = false
    selectedVariantIndexes.value = new Set()
    toast.success(`已更新 ${res.data?.updated} 个规格`)
  } else {
    toast.error(res.error || '更新失败')
  }
}

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
  const selectedKeys = new Set<string>()
  for (const size of selectedSizes.value) {
    for (const color of selectedColors.value) {
      selectedKeys.add(`${size}__${color}`)
    }
  }
  variants.value = variants.value.filter(v => {
    if (!v.size && !v.color) return true
    return !selectedKeys.has(`${v.size}__${v.color}`)
  })
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

onMounted(async () => {
  await loadCategories()
  if (isEdit.value) {
    await Promise.all([loadProduct(), loadProductOptions(), loadVariants(), loadBaseDesign()])
  }
})
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(-4px);
}
</style>
