"use client"
import Image from "next/image"
import { useState } from "react"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  style?: React.CSSProperties
}

export function LazyImage({ src, alt, width, height, className, priority = false, fill = false, style }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative ${className || ""}`} style={style}>
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          loading={priority ? "eager" : "lazy"}
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 500}
          height={height || 500}
          loading={priority ? "eager" : "lazy"}
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  )
}
