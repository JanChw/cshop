import { createSignal } from 'solid-js'
import { showToast } from '../../lib/toast'

interface Address {
  id: string
  name: string
  phone: string
  region: string
  address: string
  isDefault: boolean
}

const mockAddresses: Address[] = [
  { id: 'a1', name: '陈小木', phone: '13856788888', region: '上海市浦东新区', address: '上海市浦东新区陆家嘴环路 1233 号 汇丰大厦 18 层', isDefault: true },
  { id: 'a2', name: '林屿', phone: '15912340012', region: '浙江省杭州市西湖区', address: '浙江省杭州市西湖区灵隐街道 法云弄 22 号 隐逸山庄', isDefault: false },
  { id: 'a3', name: '张子谦', phone: '18678904567', region: '北京市朝阳区', address: '北京市朝阳区三里屯街道北三里屯南 42 号楼 3 单元 502 室', isDefault: false }
]

export default function AddressManager() {
  const [addresses, setAddresses] = createSignal(mockAddresses)
  const [formOpen, setFormOpen] = createSignal(false)
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [formName, setFormName] = createSignal('')
  const [formPhone, setFormPhone] = createSignal('')
  const [formRegion, setFormRegion] = createSignal('')
  const [formDetail, setFormDetail] = createSignal('')
  const [formDefault, setFormDefault] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [deleteId, setDeleteId] = createSignal<string | null>(null)

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
    showToast('已设为默认地址')
  }

  const confirmDelete = () => {
    const id = deleteId()
    if (!id) return
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    setDeleteId(null)
    showToast('地址已删除')
  }

  const cancelDelete = () => setDeleteId(null)

  const openAdd = () => {
    setEditingId(null)
    setFormName('')
    setFormPhone('')
    setFormRegion('')
    setFormDetail('')
    setFormDefault(false)
    setFormOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    setFormName(addr.name)
    setFormPhone(addr.phone)
    setFormRegion(addr.region)
    setFormDetail(addr.address.replace(addr.region, '').trim())
    setFormDefault(addr.isDefault)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const save = () => {
    if (!formName().trim()) { showToast('请输入收货人姓名'); return }
    if (!formPhone().trim()) { showToast('请输入手机号'); return }
    if (!/^1\d{10}$/.test(formPhone().trim())) { showToast('请输入正确的手机号'); return }
    if (!formRegion().trim()) { showToast('请输入所在地区'); return }
    if (!formDetail().trim()) { showToast('请输入详细地址'); return }

    setSaving(true)

    const isEditing = editingId() !== null
    const id = editingId() ?? `a${Date.now()}`
    const fullAddress = `${formRegion().trim()} ${formDetail().trim()}`
    const updated: Address = {
      id,
      name: formName().trim(),
      phone: formPhone().trim(),
      region: formRegion().trim(),
      address: fullAddress,
      isDefault: formDefault()
    }

    setAddresses((prev) => {
      let result = isEditing
        ? prev.map((a) => (a.id === editingId() ? updated : a))
        : [...prev, updated]

      if (updated.isDefault) {
        result = result.map((a) => ({ ...a, isDefault: a.id === id }))
      }

      return result
    })

    setSaving(false)
    setFormOpen(false)
    setEditingId(null)
    showToast(isEditing ? '地址已更新' : '地址已添加')
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant">
        <button
          type="button"
          onClick={() => history.back()}
          class="tap-target p-2 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="返回"
        >
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 class="text-lg font-bold text-primary">收货地址</h1>
        <button
          type="button"
          onClick={() => showToast('帮助功能即将上线')}
          class="tap-target p-2 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="帮助"
        >
          <span class="material-symbols-outlined text-primary">help_outline</span>
        </button>
      </header>

      <main class="pt-4 py-8 container-content">
        {addresses().length === 0 ? (
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">location_on</span>
            <h3 class="font-headline text-xl text-on-surface-variant">暂无收货地址</h3>
            <p class="text-sm text-outline mt-2">点击下方按钮添加您的第一个地址</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses().map((addr) => (
              <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4 shadow-card">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="font-bold text-lg text-on-surface">{addr.name}</span>
                    <span class="text-on-surface-variant font-medium">{addr.phone}</span>
                    {addr.isDefault && <span class="px-2 py-0.5 bg-primary text-on-primary text-label-md rounded-md font-medium">默认</span>}
                  </div>
                </div>
                <p class="text-on-surface-variant leading-relaxed text-sm">{addr.address}</p>
                <div class="pt-4 border-t border-outline-variant/40 flex justify-between items-center">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      onClick={() => setDefault(addr.id)}
                      class="text-label-md text-primary font-bold hover:underline tap-target"
                    >
                      设为默认
                    </button>
                  ) : <div />}
                  <div class="flex gap-6 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => openEdit(addr)}
                      class="tap-target flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">edit_square</span>编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(addr.id)}
                      class="tap-target flex items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">delete</span>删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div class="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-surface via-surface to-transparent z-50 md:bg-surface md:border-t md:border-outline-variant">
        <button
          type="button"
          onClick={openAdd}
          class="w-full h-14 bg-primary hover:opacity-90 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2 text-on-primary shadow-lg tap-target disabled:opacity-60 md:max-w-md md:mx-auto"
        >
          <span class="material-symbols-outlined">add</span>
          <span class="font-bold tracking-widest">添加新地址</span>
        </button>
      </div>

      {formOpen() && (
        <div class="fixed inset-0 z-50 flex items-end">
          <div class="absolute inset-0 bg-black/60" onClick={closeForm} />
          <div class="relative w-full bg-surface rounded-t-2xl max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl">
            <div class="sticky top-0 bg-surface rounded-t-2xl z-10">
              <div class="flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 rounded-full bg-outline-variant/60" />
              </div>
              <div class="flex items-center justify-between px-6 pb-4">
                <h3 class="text-title-md font-bold text-on-surface">
                  {editingId() !== null ? '编辑地址' : '添加地址'}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  class="tap-target p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  aria-label="关闭"
                >
                  <span class="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
            </div>

            <div class="px-6 space-y-5 pb-6">
              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1">收货人姓名</label>
                <input
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  type="text"
                  placeholder="请输入收货人姓名"
                  value={formName()}
                  onInput={(e) => setFormName(e.currentTarget.value)}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1">手机号码</label>
                <input
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  type="tel"
                  placeholder="请输入手机号码"
                  maxLength="11"
                  value={formPhone()}
                  onInput={(e) => setFormPhone(e.currentTarget.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1">所在地区</label>
                <input
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  type="text"
                  placeholder="如：浙江省杭州市西湖区"
                  value={formRegion()}
                  onInput={(e) => setFormRegion(e.currentTarget.value)}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1">详细地址</label>
                <textarea
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none"
                  placeholder="街道、楼栋、门牌号等"
                  rows="3"
                  value={formDetail()}
                  onInput={(e) => setFormDetail(e.currentTarget.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => setFormDefault(!formDefault())}
                class="flex items-center justify-between w-full p-4 bg-surface-container-low rounded-lg tap-target"
                aria-pressed={formDefault()}
              >
                <span class="text-body-lg text-on-surface">设为默认地址</span>
                <div
                  class={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    formDefault() ? 'bg-primary' : 'bg-outline-variant/60'
                  }`}
                >
                  <div
                    class={`w-5 h-5 rounded-full bg-inverse-surface shadow-sm transition-transform ${
                      formDefault() ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>

            <div class="sticky bottom-0 bg-surface px-6 py-4 border-t border-outline-variant pb-[calc(16px+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={save}
                disabled={saving()}
                class="w-full h-12 bg-primary hover:opacity-90 active:scale-95 transition-all rounded-xl text-on-primary font-bold tracking-wider tap-target disabled:opacity-60"
              >
                {saving() ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId() !== null && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={cancelDelete}>
          <div class="absolute inset-0 bg-black/60" />
          <div
            class="relative bg-surface rounded-2xl w-full max-w-xs p-6 shadow-elevated flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mb-4">
              <span class="material-symbols-outlined text-error text-3xl">delete</span>
            </div>
            <h3 class="text-title-md font-bold text-on-surface mb-2">确认删除</h3>
            <p class="text-body-sm text-on-surface-variant mb-6">删除后无法恢复，确定要删除这个地址吗？</p>
            <div class="flex gap-3 w-full">
              <button
                type="button"
                onClick={cancelDelete}
                class="flex-1 h-11 border border-outline rounded-xl text-on-surface-variant font-bold text-label-md hover:bg-surface-container transition-colors tap-target"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                class="flex-1 h-11 bg-error text-on-error rounded-xl font-bold text-label-md hover:opacity-90 active:scale-95 transition-all tap-target"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
