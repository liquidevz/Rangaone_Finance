interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
}

export function MobileVideoPlayer({ youtubeId, title }: MobileVideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video bg-black">
      <iframe 
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}