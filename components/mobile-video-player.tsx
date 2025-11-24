interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
}

export function MobileVideoPlayer({ youtubeId, title }: MobileVideoPlayerProps) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe 
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}