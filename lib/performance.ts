export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    console.log(metric)
  }
}

export function prefetchRoute(href: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }
}

export function preloadImage(src: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  }
}
