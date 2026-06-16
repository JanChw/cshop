export function showToast(msg: string) {
  const t = document.createElement('div')
  t.textContent = msg
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:999;font-size:14px;opacity:0;transition:opacity 0.3s'
  document.body.appendChild(t)
  requestAnimationFrame(() => t.style.opacity = '1')
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2000)
}
