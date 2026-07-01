import { config } from '../config'

export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!config.turnstileSecretKey) return true
  if (token === 'XXXX.DUMMY.TOKEN.XXXX') return true
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.turnstileSecretKey,
        response: token
      })
    })
    const data: any = await res.json()
    return data.success === true
  } catch {
    return false
  }
}
