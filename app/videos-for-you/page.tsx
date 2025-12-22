"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Calendar, Clock, User, Loader2, Folder, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { portfolioService } from "@/services/portfolio.service"
import { Portfolio } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileVideoPlayer } from "@/components/mobile-video-player"

interface VideoData {
  id: string
  title: string
  youtubeId: string
  portfolioName: string
  portfolioCategory: string
  createdAt: string
  thumbnail?: string
  portfolioId: string
  description?: string
}

interface PortfolioGroup {
  portfolioId: string
  portfolioName: string
  portfolioCategory: string
  description?: string
  videos: VideoData[]
}

export default function VideosForYou() {
  const [activeTab, setActiveTab] = useState("all")
  const [portfolioGroups, setPortfolioGroups] = useState<PortfolioGroup[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const isMobile = useIsMobile()

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : ""
  }

  // Fetch portfolios and group videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true)
        const portfolios = await portfolioService.getAll()
        
        const groups: PortfolioGroup[] = []
        
        portfolios.forEach((portfolio: Portfolio) => {
          if (portfolio.youTubeLinks && portfolio.youTubeLinks.length > 0) {
            const videos: VideoData[] = []
            
            portfolio.youTubeLinks.forEach((videoLink, index) => {
              const youtubeId = extractYouTubeId(videoLink.link)
              if (youtubeId) {
                videos.push({
                  id: `${portfolio._id}-${index}`,
                  title: (portfolio.youTubeLinks?.length || 0) === 1 ? portfolio.name : `${portfolio.name} - Part ${index + 1}`,
                  youtubeId,
                  portfolioName: portfolio.name,
                  portfolioCategory: portfolio.PortfolioCategory || "General",
                  createdAt: videoLink.createdAt,
                  thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
                  portfolioId: portfolio._id,
                  description: typeof portfolio.description === 'string' 
                    ? portfolio.description 
                    : Array.isArray(portfolio.description) 
                      ? (portfolio.description as { key: string; value: string }[]).find(d => d.key === 'general')?.value || ''
                      : ''
                })
              }
            })
            
            if (videos.length > 0) {
              groups.push({
                portfolioId: portfolio._id,
                portfolioName: portfolio.name,
                portfolioCategory: portfolio.PortfolioCategory || "General",
                description: typeof portfolio.description === 'string' 
                  ? portfolio.description 
                  : Array.isArray(portfolio.description) 
                    ? (portfolio.description as { key: string; value: string }[]).find(d => d.key === 'general')?.value || ''
                    : '',
                videos: videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              })
            }
          }
        })
        
        // Sort groups by category (Premium first) then by name
        groups.sort((a, b) => {
          if (a.portfolioCategory !== b.portfolioCategory) {
            return a.portfolioCategory.toLowerCase() === "premium" ? -1 : 1
          }
          return a.portfolioName.localeCompare(b.portfolioName)
        })
        
        setPortfolioGroups(groups)
        if (groups.length > 0 && groups[0].videos.length > 0) {
          setSelectedVideo(groups[0].videos[0])
        }
      } catch (err) {
        setError("Failed to load videos")
        console.error("Error fetching videos:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // Handle video selection with error handling
  const handleVideoSelect = (video: VideoData) => {
    setVideoError(null)
    setVideoLoading(true)
    setSelectedVideo(video)
    
    // Scroll to video player on selection
    const videoPlayer = document.getElementById('video-player-section')
    if (videoPlayer) {
      videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setVideoLoading(false)
    }, 1000)
  }

  const filteredGroups = portfolioGroups.filter((group) => {
    if (activeTab === "all") return true
    return group.portfolioCategory.toLowerCase() === activeTab.toLowerCase()
  })

  const categories = ["all", ...Array.from(new Set(portfolioGroups.map((group) => group.portfolioCategory.toLowerCase())))]
  const totalVideos = portfolioGroups.reduce((sum, group) => sum + group.videos.length, 0)

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-6">
        <PageHeader 
          title="Videos For You" 
          subtitle="Educational content and market insights from our portfolios"
          showBackButton={false}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#131859]" />
            <span className="ml-2 text-gray-600">Loading videos...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* No Videos State */}
        {!loading && !error && portfolioGroups.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No videos available at the moment.</p>
          </div>
        )}

        {/* Featured Video Player */}
        {selectedVideo && (
          <div id="video-player-section" className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="w-full bg-black relative rounded-t-xl overflow-hidden">
              <MobileVideoPlayer
                youtubeId={selectedVideo.youtubeId}
                title={selectedVideo.title}
              />
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                Now Playing
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedVideo.title}</h2>
                  {selectedVideo.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{selectedVideo.description}</p>
                  )}
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0",
                  selectedVideo.portfolioCategory.toLowerCase() === "premium" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-[#131859] text-white"
                )}>
                  {selectedVideo.portfolioCategory}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                  <User className="h-4 w-4 mr-2" />
                  {selectedVideo.portfolioName}
                </span>
                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(selectedVideo.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Video Library */}
        {portfolioGroups.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#131859] p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Portfolio Video Library</h2>
              <p className="text-blue-100">{totalVideos} educational videos from {portfolioGroups.length} portfolios</p>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="w-full flex flex-wrap justify-start bg-gray-50 p-2 h-auto gap-2 rounded-lg">
                  {categories.map((category) => {
                    const count = category === "all" 
                      ? totalVideos 
                      : portfolioGroups
                          .filter(group => group.portfolioCategory.toLowerCase() === category.toLowerCase())
                          .reduce((sum, group) => sum + group.videos.length, 0);
                    return (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className={cn(
                          "py-3 px-4 rounded-lg font-medium transition-all duration-200 capitalize",
                          activeTab === category
                            ? "bg-[#131859] text-white shadow-md"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200",
                        )}
                      >
                        {category} <span className="ml-1 text-xs opacity-75">({count})</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="p-6 space-y-8">
                {filteredGroups.map((group) => (
                  <div key={group.portfolioId} className="">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        group.portfolioCategory.toLowerCase() === "premium"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-[#131859]"
                      )}>
                        <Folder className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{group.portfolioName}</h3>
                        <p className="text-sm text-gray-600">{group.videos.length} video{group.videos.length > 1 ? 's' : ''} • {group.portfolioCategory}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {group.videos.map((video, index) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onClick={() => handleVideoSelect(video)}
                          isSelected={selectedVideo?.id === video.id}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Play className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">No portfolios found in this category.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function VideoCard({ video, onClick, isSelected, index }: { 
  video: VideoData; 
  onClick: () => void; 
  isSelected: boolean;
  index: number;
}) {
  return (
    <Card
      className={cn(
        "group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border-2",
        isSelected 
          ? "ring-4 ring-indigo-500/50 border-indigo-500 shadow-xl" 
          : "border-gray-200 hover:border-indigo-300",
      )}
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <img 
            src={video.thumbnail || "/placeholder.svg"} 
            alt={video.title} 
            className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-indigo-600 fill-current" />
            </div>
          </div>
          {isSelected && (
            <div className="absolute top-3 right-3 bg-[#131859] text-white px-2 py-1 rounded-full text-xs font-semibold">
              Playing
            </div>
          )}
          <div className={cn(
            "absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold",
            video.portfolioCategory.toLowerCase() === "premium"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-[#131859] text-white"
          )}>
            {video.portfolioCategory}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-[#131859] transition-colors">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 font-medium">{video.portfolioName}</p>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
