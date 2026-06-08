export type DeviceType = 'desktop' | 'mobile' | 'tablet'

const MOBILE_RE = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
const TABLET_RE = /iPad|Android/i

export function detectDevice(ua: string | undefined | null): DeviceType {
  if (!ua) return 'desktop'
  if (TABLET_RE.test(ua) && !MOBILE_RE.test(ua)) return 'tablet'
  if (MOBILE_RE.test(ua)) return 'mobile'
  if (TABLET_RE.test(ua)) return 'tablet'
  return 'desktop'
}
