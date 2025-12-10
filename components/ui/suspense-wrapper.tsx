"use client"
import { Suspense } from "react"

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 rounded-lg h-32" />}>
      {children}
    </Suspense>
  )
}
