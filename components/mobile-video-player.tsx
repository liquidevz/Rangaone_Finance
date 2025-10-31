"use client"

import { useState, useEffect } from "react"
import { Play, AlertCircle, Loader2 } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"

interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
  onError?: (error: string) => void
  debug?: boolean
}

export function MobileVideoPlayer({ youtubeId, title, onError, debug = false }: MobileVideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const isMobile = useIsMobile()

  const handleIframeLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    const errorMsg = "Video player failed to load"
    setError(errorMsg)
    setLoading(false)
    onError?.(errorMsg)
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setRetryCount(prev => prev + 1)
  }

  // Build YouTube URL with mobile-optimized parameters
  const buildYouTubeUrl = () => {
    const baseUrl = `https://www.youtube.com/embed/${youtubeId}`
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      autoplay: '0',
      mute: '0',
      controls: '1',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      disablekb: '0',
      showinfo: '0'
    })

    // Add origin and referrer for better compatibility
    if (typeof window !== 'undefined') {
      params.set('origin', window.location.origin)
      params.set('widget_referrer', window.location.origin)
    }

    return `${baseUrl}?${params.toString()}`
  }

  useEffect(() => {
    // Reset states when youtubeId changes
    setLoading(true)
    setError(null)
    setRetryCount(0)
  }, [youtubeId])

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-center mb-2 font-medium">Unable to load video</p>
        <p className="text-center text-sm text-gray-300 mb-2">
          {isMobile ? "Try opening in YouTube app" : "Please check your connection"}
        </p>
        {debug && (
          <p className="text-center text-xs text-gray-400 mb-4 font-mono">
            ID: {youtubeId} | Retries: {retryCount} | Mobile: {isMobile ? 'Yes' : 'No'}
          </p>
        )}
        <div className="flex gap-3">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Open in YouTube
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <iframe
        key={`${youtubeId}-${retryCount}`}
        width="100%"
        height="100%"
        src={buildYouTubeUrl()}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full"
        style={{ border: 'none', background: '#000' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </>
  )
}