"use client"
import { useEffect, useRef, useState } from "react"

interface OptimizedVideoProps {
  src: string
  poster?: string
  className?: string
}

export function OptimizedVideo({ src, poster, className }: OptimizedVideoProps) {
  const videoRef = useRef<HTMLIFrameElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={videoRef} className={className}>
      {isVisible && (
        <iframe
          src={src}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full"
        />
      )}
    </div>
  )
}
