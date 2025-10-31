interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
}

export function MobileVideoPlayer({ youtubeId, title }: MobileVideoPlayerProps) {
  return (
    <div className="responsive-container">
      <iframe 
        src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        title={title}
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}