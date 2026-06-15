<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="handleClose"
      >
        <div class="absolute inset-0 bg-black/50" />

        <div class="relative glass rounded-md w-[520px] border border-border flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 class="text-base font-semibold text-text-primary">
              {{ staff ? '编辑员工' : '新增员工' }}
            </h2>
            <button
              class="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              @click="handleClose"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="px-6 py-6 flex flex-col gap-4 overflow-y-auto">
            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">邮箱 <span class="text-danger">*</span></label>
              <input
                v-model="form.email"
                type="email"
                placeholder="用于登录"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">初始密码 <span class="text-danger">*</span></label>
              <input
                v-model="form.password"
                type="password"
                placeholder="至少 6 位"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">姓名 <span class="text-danger">*</span></label>
              <input
                v-model="form.name"
                type="text"
                placeholder="员工姓名"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">角色 <span class="text-danger">*</span></label>
              <div class="relative">
                <select
                  v-model.number="form.roleId"
                  class="w-full h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
                >
                  <option :value="0" disabled>请选择角色</option>
                  <option
                    v-for="r in availableRoles"
                    :key="r.id"
                    :value="r.id"
                    :disabled="r.name === 'super_admin' && !isSuperAdmin"
                  >
                    {{ r.displayName }}
                    <template v-if="r.name === 'super_admin' && !isSuperAdmin">（仅超管可创建）</template>
                  </option>
                </select>
                <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">工号</label>
              <input
                v-model="form.employeeNo"
                type="text"
                placeholder="可选"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">部门</label>
              <input
                v-model="form.department"
                type="text"
                placeholder="可选"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <div v-if="!staff" class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-text-primary">职位</label>
              <input
                v-model="form.position"
                type="text"
                placeholder="可选"
                class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            <template v-if="staff">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">邮箱</label>
                <div class="h-9 px-3 flex items-center text-sm text-text-muted font-mono bg-gray-50 rounded border border-border">
                  {{ staff.email }}
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">姓名</label>
                <div class="h-9 px-3 flex items-center text-sm text-text-muted bg-gray-50 rounded border border-border">
                  {{ staff.name }}
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">角色</label>
                <div class="relative">
                  <select
                    v-model.number="form.roleId"
                    class="w-full h-9 rounded border border-border px-3 pr-8 text-sm text-text-primary bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option
                      v-for="r in availableRoles"
                      :key="r.id"
                      :value="r.id"
                      :disabled="r.name === 'super_admin' && !isSuperAdmin"
                    >
                      {{ r.displayName }}
                      <template v-if="r.name === 'super_admin' && !isSuperAdmin">（仅超管可设置）</template>
                    </option>
                  </select>
                  <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">工号</label>
                <input
                  v-model="form.employeeNo"
                  type="text"
                  placeholder="可选"
                  class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">部门</label>
                <input
                  v-model="form.department"
                  type="text"
                  placeholder="可选"
                  class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-text-primary">职位</label>
                <input
                  v-model="form.position"
                  type="text"
                  placeholder="可选"
                  class="h-9 rounded border border-border px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>
            </template>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              class="h-10 rounded border border-border px-4 text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="h-10 rounded bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
              @click="handleSave"
            >
              <Check :size="16" />
              {{ staff ? '确认修改' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { X, Check, ChevronDown } from 'lucide-vue-next'

export interface StaffRow {
  id: number
  userId: number
  roleId: number
  roleName: string
  roleDisplayName: string
  department: string | null
  position: string | null
  employeeNo?: string | null
  status: 'active' | 'suspended' | 'resigned'
  statusLabel: string
  hiredAt: string
  email: string
  name: string
}

export interface Role {
  id: number
  name: string
  displayName: string
}

export interface CreateStaffPayload {
  email: string
  password: string
  name: string
  roleId: number
  employeeNo?: string
  department?: string
  position?: string
}

export interface UpdateStaffPayload {
  roleId?: number
  employeeNo?: string | null
  department?: string | null
  position?: string | null
}

const props = defineProps<{
  visible: boolean
  staff?: StaffRow | null
  availableRoles: Role[]
  isSuperAdmin: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateStaffPayload | UpdateStaffPayload]
}>()

const form = reactive({
  email: '',
  password: '',
  name: '',
  roleId: 0 as number,
  employeeNo: '',
  department: '',
  position: ''
})

function resetForm() {
  form.email = ''
  form.password = ''
  form.name = ''
  form.roleId = 0
  form.employeeNo = ''
  form.department = ''
  form.position = ''
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.staff) {
        form.email = props.staff.email
        form.password = ''
        form.name = props.staff.name
        form.roleId = props.staff.roleId
        form.employeeNo = props.staff.employeeNo ?? ''
        form.department = props.staff.department ?? ''
        form.position = props.staff.position ?? ''
      } else {
        resetForm()
      }
    }
  }
)

function handleClose() {
  emit('close')
}

function handleSave() {
  if (props.staff) {
    const data: UpdateStaffPayload = {
      roleId: form.roleId || undefined,
      employeeNo: form.employeeNo.trim() || null,
      department: form.department.trim() || null,
      position: form.position.trim() || null
    }
    emit('save', data)
  } else {
    if (!form.email.trim() || !form.password.trim() || !form.name.trim() || !form.roleId) return
    const data: CreateStaffPayload = {
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      roleId: form.roleId
    }
    if (form.employeeNo.trim()) data.employeeNo = form.employeeNo.trim()
    if (form.department.trim()) data.department = form.department.trim()
    if (form.position.trim()) data.position = form.position.trim()
    emit('save', data)
  }
}
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
