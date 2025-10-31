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



  useEffect(() => {
    // Reset states when youtubeId changes
    setLoading(true)
    setError(null)
    setRetryCount(0)
  }, [youtubeId])



  // Desktop iframe
  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-center mb-4">Unable to load video</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        frameBorder="0"
        allowFullScreen
        className="w-full h-full"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </>
  )
}