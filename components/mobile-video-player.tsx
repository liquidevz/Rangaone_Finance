'use client';

import { useEffect, useState } from 'react';

interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
}

export function MobileVideoPlayer({ youtubeId, title }: MobileVideoPlayerProps) {
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
      <iframe
        key={youtubeId}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1${origin ? `&origin=${origin}` : ''}`}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ border: 'none' }}
      />
    </div>
  )
}