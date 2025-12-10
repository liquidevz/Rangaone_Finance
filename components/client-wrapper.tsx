'use client'

import dynamic from 'next/dynamic'

export const PrefetchRoutes = dynamic(() => import("@/components/prefetch-routes").then(m => ({ default: m.PrefetchRoutes })), { ssr: false })
export const Toaster = dynamic(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })), { ssr: false })
