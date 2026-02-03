"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Calendar, User, Loader2, Folder, Layers, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { userPortfolioService, VideoBundle, VideoItem } from "@/services/user-portfolio.service"
import { PageHeader } from "@/components/page-header"
import { MobileVideoPlayer } from "@/components/mobile-video-player"
import { Button } from "@/components/ui/button"

export default function VideosForYou() {
  const [data, setData] = useState<{ bundles: VideoBundle[], portfolios: VideoBundle[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<{ video: VideoItem, bundleName: string, category: string } | null>(null)

  // Fetch videos from new API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true)
        const response = await userPortfolioService.getVideosForYou()
        setData(response)

        // Auto-select first video if available
        if (response.bundles.length > 0 && response.bundles[0].videos.length > 0) {
          const firstBundle = response.bundles[0];
          setSelectedVideo({
            video: firstBundle.videos[0],
            bundleName: firstBundle.name,
            category: firstBundle.category
          });
        } else if (response.portfolios.length > 0 && response.portfolios[0].videos.length > 0) {
          const firstPortfolio = response.portfolios[0];
          setSelectedVideo({
            video: firstPortfolio.videos[0],
            bundleName: firstPortfolio.name,
            category: firstPortfolio.category
          });
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

  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url ? url.match(regex) : null
    return match ? match[1] : ""
  }

  const handleVideoSelect = (video: VideoItem, bundleName: string, category: string) => {
    setSelectedVideo({ video, bundleName, category })
    // Smooth scroll to player
    const playerElement = document.getElementById('main-video-player')
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const renderVideoSection = (title: string, items: VideoBundle[], icon: any) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#131859] p-2 rounded-lg text-white">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((bundle) => (
            bundle.videos.map((video, idx) => {
              const youtubeId = extractYouTubeId(video.link)
              if (!youtubeId) return null

              const isSelected = selectedVideo?.video.link === video.link

              return (
                <Card
                  key={`${bundle.id}-${idx}`}
                  className={cn(
                    "group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border-2 flex flex-col h-full",
                    isSelected
                      ? "ring-2 ring-[#C5A059] border-[#C5A059] shadow-lg"
                      : "border-gray-100 hover:border-blue-200"
                  )}
                  onClick={() => handleVideoSelect(video, bundle.name, bundle.category)}
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                      alt={bundle.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="h-6 w-6 text-white fill-current" />
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className={cn(
                      "absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      bundle.category.toLowerCase() === "premium"
                        ? "bg-gradient-to-r from-[#C5A059] to-[#E6C685] text-[#131859]"
                        : "bg-blue-600/90 text-white"
                    )}>
                      {bundle.category}
                    </div>

                    {/* Duration/Status */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-[#131859]/90 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        PLAYING
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col flex-grow relative">
                    {/* Card Type Tag */}
                    <div className="absolute -top-3 left-4 bg-white shadow-sm border border-gray-100 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      {bundle.type === 'bundle' ? <Layers className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                      {bundle.type}
                    </div>

                    <div className="mt-2">
                      <h3 className="font-bold text-base leading-tight text-gray-900 group-hover:text-[#131859] transition-colors mb-2">
                        {bundle.name}
                      </h3>
                      {/* Assuming multiple videos per bundle, showing part/episode info could be useful if provided, 
                            but API structure suggests simple list. We treat each video as an episode of the bundle. */}
                      {bundle.videos.length > 1 && (
                        <p className="text-xs text-gray-500 mb-2">Episode {idx + 1}</p>
                      )}
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-[#C5A059] font-medium">
                        Watch Now <Play className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-6 pb-12">
        <PageHeader
          title="Videos For You"
          subtitle="Exclusive market insights and educational content curated for you"
        />

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
            <Loader2 className="h-10 w-10 animate-spin text-[#131859] mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Curating your video feed...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-8">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Youtube className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Unable to load videos</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 hover:bg-red-50 text-red-700">
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Main Player Section */}
            {selectedVideo && (
              <div id="main-video-player" className="bg-[#0A0E2E] rounded-2xl overflow-hidden shadow-2xl border border-[#1e2345] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-3 gap-0">
                  <div className="lg:col-span-2 relative">
                    <MobileVideoPlayer
                      youtubeId={extractYouTubeId(selectedVideo.video.link)}
                      title={selectedVideo.bundleName}
                    />
                  </div>
                  <div className="p-6 lg:p-8 flex flex-col justify-center bg-gradient-to-b from-[#0A0E2E] to-[#0f143c]">
                    <div className="mb-auto">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          selectedVideo.category.toLowerCase() === "premium"
                            ? "bg-gradient-to-r from-[#C5A059] to-[#E6C685] text-[#131859]"
                            : "bg-blue-600 text-white"
                        )}>
                          {selectedVideo.category}
                        </span>
                        <span className="text-[#C5A059] text-xs font-mono">
                          {new Date(selectedVideo.video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                        {selectedVideo.bundleName}
                      </h1>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        Watch this exclusive insight. This content is curated based on your portfolio subscriptions and interests.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>RangaOne Finance</span>
                        <div className="flex items-center gap-2">
                          <span>Share</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white/10 hover:text-white">
                            <Youtube className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {data.bundles.length === 0 && data.portfolios.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
                  <Play className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No videos available</h3>
                <p className="text-gray-500 text-sm">Check back later for new updates.</p>
              </div>
            )}

            <div className="space-y-12">
              {renderVideoSection("Exclusive Bundles", data.bundles, <Layers className="h-5 w-5" />)}
              {renderVideoSection("Portfolio Insights", data.portfolios, <Folder className="h-5 w-5" />)}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
