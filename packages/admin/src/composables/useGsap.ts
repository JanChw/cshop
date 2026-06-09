import { onUnmounted } from 'vue'
import gsap from 'gsap'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useGsap() {
  const tweens: gsap.core.Tween[] = []

  function to(targets: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
    if (prefersReducedMotion()) {
      const t = gsap.set(targets, { opacity: 1, ...vars })
      tweens.push(t)
      return t
    }
    const t = gsap.to(targets, vars)
    tweens.push(t)
    return t
  }

  function from(targets: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
    if (prefersReducedMotion()) {
      const t = gsap.set(targets, { opacity: 1, ...vars })
      tweens.push(t)
      return t
    }
    const t = gsap.from(targets, vars)
    tweens.push(t)
    return t
  }

  function timeline(vars?: gsap.TimelineVars) {
    if (prefersReducedMotion()) {
      const tl = gsap.timeline({ ...vars })
      return tl
    }
    const tl = gsap.timeline(vars)
    return tl
  }

  function staggerIn(targets: gsap.TweenTarget, vars: gsap.TweenVars = {}): gsap.core.Tween {
    return from(targets, { opacity: 0, y: 12, duration: 0.35, stagger: 0.05, ease: 'power2.out', ...vars })
  }

  function countUp(el: HTMLElement | null, target: number, duration = 1): gsap.core.Tween | null {
    if (!el) return null
    if (prefersReducedMotion()) {
      el.textContent = target.toLocaleString()
      return null
    }
    const obj = { value: 0 }
    const t = gsap.to(obj, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => { el!.textContent = Math.round(obj.value).toLocaleString() }
    })
    tweens.push(t)
    return t
  }

  onUnmounted(() => {
    for (const t of tweens) t.kill()
  })

  return { to, from, timeline, staggerIn, countUp }
}
