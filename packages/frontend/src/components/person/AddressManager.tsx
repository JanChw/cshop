import { createSignal } from 'solid-js'
import { showToast } from '../../lib/toast'

interface Address {
  id: string
  name: string
  phone: string
  address: string
  isDefault: boolean
}

const mockAddresses: Address[] = [
  { id: 'a1', name: '陈小木', phone: '138 **** 8888', address: '上海市浦东新区陆家嘴环路 1233 号汇丰大厦 18 层', isDefault: true },
  { id: 'a2', name: '林屿', phone: '159 **** 0012', address: '浙江省杭州市西湖区灵隐街道 法云弄 22 号 隐逸山庄', isDefault: false },
  { id: 'a3', name: '张子谦', phone: '186 **** 4567', address: '北京市朝阳区三里屯街道北三里屯南42号楼3单元502室', isDefault: false }
]

export default function AddressManager() {
  const [addresses, setAddresses] = createSignal(mockAddresses)
  const [adding, setAdding] = createSignal(false)

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
    showToast('已设为默认地址')
  }

  const remove = (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    showToast('地址已删除')
  }

  return (
    <div>
      <header class="fixed top-0 w-full z-50 bg-surface shadow-sm h-16 flex justify-between items-center px-6">
        <button onclick={() => history.back()} class="text-on-surface hover:opacity-80 transition-opacity active:scale-95">
          <span class="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 class="font-headline text-2xl font-bold text-primary">收货地址</h1>
        <button class="text-on-surface hover:opacity-80 transition-opacity active:scale-95">
          <span class="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      <main class="mt-16 mb-24 px-5 py-8 max-w-2xl mx-auto w-full">
        {addresses().length === 0 ? (
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">location_on</span>
            <h3 class="font-headline text-xl text-on-surface-variant">暂无收货地址</h3>
            <p class="text-sm text-outline mt-2">点击下方按钮添加您的第一个地址</p>
          </div>
        ) : (
          <div class="space-y-4">
            {addresses().map((addr) => (
              <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-4 shadow-card">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <span class="font-bold text-lg text-on-surface">{addr.name}</span>
                    <span class="text-on-surface-variant font-medium">{addr.phone}</span>
                    {addr.isDefault && <span class="px-2 py-0.5 bg-primary text-white text-[10px] rounded-md font-bold tracking-wider">默认</span>}
                  </div>
                </div>
                <p class="text-on-surface-variant leading-relaxed text-sm">{addr.address}</p>
                <div class="pt-4 border-t border-outline-variant/40 flex justify-between items-center">
                  {!addr.isDefault ? (
                    <button onclick={() => setDefault(addr.id)} class="text-[12px] text-primary font-bold hover:underline">设为默认</button>
                  ) : <div />}
                  <div class="flex gap-6 text-sm font-semibold">
                    <button onclick={() => showToast('编辑功能即将上线')} class="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                      <span class="material-symbols-outlined text-[18px]">edit_square</span>编辑
                    </button>
                    <button onclick={() => remove(addr.id)} class="flex items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors">
                      <span class="material-symbols-outlined text-[18px]">delete</span>删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div class="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-surface via-surface to-transparent z-50">
        <button onclick={() => { setAdding(true); setTimeout(() => { setAdding(false); showToast('添加地址功能即将上线') }, 300) }}
          class="w-full h-14 bg-primary hover:opacity-90 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2 text-white shadow-lg">
          <span class="material-symbols-outlined">add</span>
          <span class="font-bold tracking-widest">{adding() ? '添加中...' : '添加新地址'}</span>
        </button>
      </div>
    </div>
  )
}
