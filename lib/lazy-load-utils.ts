export const lazyLoadConfig = {
  rootMargin: '50px',
  threshold: 0.01,
}

export function setupIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, lazyLoadConfig)
}
