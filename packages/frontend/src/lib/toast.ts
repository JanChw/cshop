export function showToast(msg: string) {
  const t = document.createElement('div')
  t.className = 'toast-msg'
  t.textContent = msg
  document.body.appendChild(t)
  requestAnimationFrame(() => { t.style.opacity = '1' })
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2000)
}
