interface MobileVideoPlayerProps {
  youtubeId: string
  title: string
}

export function MobileVideoPlayer({ youtubeId, title }: MobileVideoPlayerProps) {
  return (
    <div className="responsive-container">
      <iframe 
        src={`https://www.youtube.com/embed/${youtubeId}`} 
        title={title}
        frameBorder="0" 
        allowFullScreen
      />
    </div>
  )
}