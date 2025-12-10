"use client"
import { useEffect, useRef, useState } from "react"
import { setupIntersectionObserver } from "@/lib/lazy-load-utils"

interface LazySectionProps {
  children: React.ReactNode
  className?: string
  fallback?: React.ReactNode
}

export function LazySection({ children, className, fallback }: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = setupIntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer?.disconnect()
        }
      })
    })

    if (ref.current && observer) {
      observer.observe(ref.current)
    }

    return () => observer?.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback || <div className="min-h-[200px]" />}
    </div>
  )
}
