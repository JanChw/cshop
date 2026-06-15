import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

try {
  const app = createApp(App)
  app.use(router)

  app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue Error]', err, info)
    const el = document.getElementById('app')
    if (el) {
      el.innerHTML = `<div style="padding:40px;font-family:monospace;color:red;background:#fff;white-space:pre-wrap">${err instanceof Error ? err.stack || err.message : String(err)}</div>`
    }
  }

  app.mount('#app')
} catch (err) {
  console.error('[Mount Error]', err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML = `<div style="padding:40px;font-family:monospace;color:red;background:#fff;white-space:pre-wrap">${err instanceof Error ? err.stack || err.message : String(err)}</div>`
  }
}

window.addEventListener('error', (e) => {
  const el = document.getElementById('app')
  if (el && !el.querySelector('div')) {
    el.innerHTML = `<div style="padding:40px;font-family:monospace;color:red;background:#fff;white-space:pre-wrap">Global Error: ${e.message}\n${e.filename}:${e.lineno}:${e.colno}</div>`
  }
})

window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('app')
  if (el && !el.querySelector('div')) {
    el.innerHTML = `<div style="padding:40px;font-family:monospace;color:red;background:#fff;white-space:pre-wrap">Unhandled Promise Rejection: ${e.reason}</div>`
  }
})
