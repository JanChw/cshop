import { createSignal, onMount } from 'solid-js'
import { showToast } from '../../lib/toast'
import { api } from '../../lib/api'

interface Address {
  id: number
  name: string
  phone: string
  region: string
  address: string
  isDefault: boolean
}

export default function AddressManager() {
  const [addresses, setAddresses] = createSignal<Address[]>([])
  const [formOpen, setFormOpen] = createSignal(false)
  const [editingId, setEditingId] = createSignal<number | null>(null)
  const [formName, setFormName] = createSignal('')
  const [formPhone, setFormPhone] = createSignal('')
  const [formRegion, setFormRegion] = createSignal('')
  const [formDetail, setFormDetail] = createSignal('')
  const [formDefault, setFormDefault] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [deleteId, setDeleteId] = createSignal<number | null>(null)

  onMount(async () => {
    try {
      const res: any = await api.addresses.list()
      if (res.success) {
        setAddresses(res.data.map((a: any) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          region: a.region,
          address: a.address,
          isDefault: a.isDefault
        })))
      }
    } catch (e) {
      showToast('加载地址失败')
    }
  })

  const setDefault = async (id: number) => {
    try {
      const res: any = await api.addresses.setDefault(id)
      if (res.success) {
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
        showToast('已设为默认地址')
      }
    } catch (e: any) {
      showToast(e.message || '设置默认地址失败')
    }
  }

  const confirmDelete = async () => {
    const id = deleteId()
    if (!id) return
    try {
      const res: any = await api.addresses.remove(id)
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
        setDeleteId(null)
        showToast('地址已删除')
      }
    } catch (e: any) {
      showToast(e.message || '删除失败')
    }
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

  const save = async () => {
    if (!formName().trim()) { showToast('请输入收货人姓名'); return }
    if (!formPhone().trim()) { showToast('请输入手机号'); return }
    if (!/^1\d{10}$/.test(formPhone().trim())) { showToast('请输入正确的手机号'); return }
    if (!formRegion().trim()) { showToast('请输入所在地区'); return }
    if (!formDetail().trim()) { showToast('请输入详细地址'); return }

    setSaving(true)

    const isEditing = editingId() !== null
    const fullAddress = `${formRegion().trim()} ${formDetail().trim()}`
    const data = {
      name: formName().trim(),
      phone: formPhone().trim(),
      region: formRegion().trim(),
      address: fullAddress,
      isDefault: formDefault()
    }

    try {
      if (isEditing) {
        const res: any = await api.addresses.update(editingId()!, data)
        if (res.success) {
          setAddresses((prev) => {
            let result = prev.map((a) =>
              a.id === editingId() ? { ...a, ...data, id: a.id } : a
            )
            if (data.isDefault) {
              result = result.map((a) => ({ ...a, isDefault: a.id === editingId() }))
            }
            return result
          })
          showToast('地址已更新')
        }
      } else {
        const res: any = await api.addresses.create(data)
        if (res.success) {
          const newAddr: Address = {
            id: res.data.id,
            name: res.data.name,
            phone: res.data.phone,
            region: res.data.region,
            address: res.data.address,
            isDefault: res.data.isDefault
          }
          setAddresses((prev) => {
            let result = [...prev, newAddr]
            if (newAddr.isDefault) {
              result = result.map((a) => ({ ...a, isDefault: a.id === newAddr.id }))
            }
            return result
          })
          showToast('地址已添加')
        }
      }
      setFormOpen(false)
      setEditingId(null)
    } catch (e: any) {
      showToast(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="bg-background min-h-screen pb-24 text-on-surface md:pt-16">
      <header class="sticky top-0 md:top-16 z-50 bg-surface h-16 flex justify-between items-center px-4 border-b border-outline-variant">
        <a
          href="/person"
          class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
          aria-label="返回"
        >
          <span class="material-symbols-outlined text-primary">arrow_back</span>
        </a>
        <h1 class="text-lg font-bold text-primary">收货地址</h1>
        <button
          type="button"
          onClick={() => showToast('帮助功能即将上线')}
          class="tap-target p-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
          aria-label="帮助"
        >
          <span class="material-symbols-outlined text-primary">help_outline</span>
        </button>
      </header>

      <main class="pt-4 py-8 container-content">
        {addresses().length === 0 ? (
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">location_on</span>
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
          class="w-full h-14 bg-primary hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-opacity transition-transform duration-200 rounded-xl flex items-center justify-center gap-2 text-on-primary shadow-lg tap-target disabled:opacity-60 md:max-w-md md:mx-auto"
        >
          <span class="material-symbols-outlined">add</span>
          <span class="font-bold tracking-widest">添加新地址</span>
        </button>
      </div>

      {formOpen() && (
        <div class="fixed inset-0 z-50 flex items-end">
          <div
            class="absolute inset-0 bg-black/60"
            onClick={closeForm}
            onKeyDown={(e) => e.key === 'Enter' && closeForm()}
            role="presentation"
          />
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
                  class="tap-target p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="关闭"
                >
                  <span class="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
            </div>

            <div class="px-6 space-y-5 pb-6">
              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1" for="addr-name">收货人姓名</label>
                <input
                  id="addr-name"
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                  type="text"
                  autocomplete="name"
                  placeholder="请输入收货人姓名"
                  value={formName()}
                  onInput={(e) => setFormName(e.currentTarget.value)}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1" for="addr-phone">手机号码</label>
                <input
                  id="addr-phone"
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                  type="tel"
                  autocomplete="tel"
                  placeholder="请输入手机号码"
                  maxLength="11"
                  value={formPhone()}
                  onInput={(e) => setFormPhone(e.currentTarget.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1" for="addr-region">所在地区</label>
                <input
                  id="addr-region"
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                  type="text"
                  autocomplete="address-level2"
                  placeholder="如：浙江省杭州市西湖区"
                  value={formRegion()}
                  onInput={(e) => setFormRegion(e.currentTarget.value)}
                />
              </div>

              <div class="space-y-2">
                <label class="text-label-md font-medium text-on-surface-variant ml-1" for="addr-detail">详细地址</label>
                <textarea
                  id="addr-detail"
                  class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none resize-none"
                  autocomplete="street-address"
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
                class="w-full h-12 bg-primary hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-opacity transition-transform duration-200 rounded-xl text-on-primary font-bold tracking-wider tap-target disabled:opacity-60"
              >
                {saving() ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId() !== null && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={cancelDelete}
          onKeyDown={(e) => e.key === 'Enter' && cancelDelete()}
          role="presentation"
        >
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
                class="flex-1 h-11 border border-outline rounded-xl text-on-surface-variant font-bold text-label-md hover:bg-primary/10 hover:text-primary transition-colors tap-target"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                class="flex-1 h-11 bg-error text-on-error rounded-xl font-bold text-label-md hover:opacity-90 active:scale-95 transition-opacity transition-transform tap-target"
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
