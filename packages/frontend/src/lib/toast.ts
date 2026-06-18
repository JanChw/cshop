export function showToast(msg: string) {
  const t = document.createElement('div')
  t.textContent = msg
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#f5f5f5;padding:12px 24px;border-radius:8px;z-index:999;font-size:14px;opacity:0;transition:opacity 0.3s;box-shadow:0 4px 24px rgba(0,0,0,0.4);border:1px solid #27272a'
  document.body.appendChild(t)
  requestAnimationFrame(() => t.style.opacity = '1')
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2000)
}
