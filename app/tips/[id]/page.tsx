"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { tipsService, Tip } from "@/services/tip.service";
import { useAuth } from "@/components/auth/auth-context";

interface ExtendedTip extends Tip {
  images?: any[];
}

// Helper function to convert raw buffer objects to base64 strings
function processImages(rawImages: any[]): string[] {
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .map((imgSrc) => {
      // Already a valid base64 string
      if (typeof imgSrc === 'string') {
        return imgSrc;
      }

      // Handle raw Mongoose Buffer object
      // Format: { data: { type: 'Buffer', data: [137, 80, ...] }, contentType: 'image/png' }
      if (imgSrc && typeof imgSrc === 'object') {
        if (imgSrc.data?.type === 'Buffer' && Array.isArray(imgSrc.data.data)) {
          try {
            const bytes = imgSrc.data.data;
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = typeof window !== 'undefined' ? window.btoa(binary) : '';
            return `data:${imgSrc.contentType || 'image/png'};base64,${base64}`;
          } catch (e) {
            console.error('Error converting image buffer:', e);
            return null;
          }
        }
      }

      return null;
    })
    .filter((src): src is string => !!src && src !== 'data:image/png;base64,');
}

// Image Modal Component with Zoom
function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageIndex,
  totalImages
}: {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageIndex: number;
  totalImages: number;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle touch pinch zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (lastTouchDistance.current !== null) {
        const delta = distance - lastTouchDistance.current;
        setScale(prev => Math.max(1, Math.min(4, prev + delta * 0.01)));
      }
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      const touch = e.touches[0];
      if (isDragging) {
        setPosition({
          x: touch.clientX - lastPosition.current.x,
          y: touch.clientY - lastPosition.current.y
        });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      lastPosition.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    setIsDragging(false);
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          {/* <span className="text-sm font-medium">Image {imageIndex + 1} of {totalImages}</span> */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image Container */}
        <div
          ref={imageRef}
          className="flex-1 flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.img
            src={imageSrc}
            alt={`Image ${imageIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              scale,
              x: position.x,
              y: position.y,
              cursor: scale > 1 ? 'grab' : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 p-4">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
          >
            <ZoomOut className="w-6 h-6" />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
          >
            <ZoomIn className="w-6 h-6" />
          </button>
          {scale !== 1 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TipDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tip, setTip] = useState<ExtendedTip | null>(null);
  const [loading, setLoading] = useState(true);

  // Carousel State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Process images once when tip changes
  const images = useMemo(() => {
    return processImages(tip?.images || []);
  }, [tip?.images]);

  useEffect(() => {
    if (params.id) {
      loadTipDetails(params.id as string);
    }
  }, [params.id]);

  // NO AUTO-SCROLL - removed the auto-scroll effect

  const loadTipDetails = async (id: string) => {
    try {
      setLoading(true);
      const tipData = await tipsService.getById(id);
      setTip(tipData);
    } catch (error) {
      console.error("Failed to load tip details:", error);
      toast({
        title: "Error",
        description: "Failed to load tip details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadLink: string) => {
    if (!downloadLink) return;
    window.open(downloadLink, '_blank');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Carousel Navigation
  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * scrollWidth,
        behavior: 'smooth'
      });
      setCurrentImageIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current && images.length > 0) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      // Ensure index is within bounds
      const boundedIndex = Math.max(0, Math.min(index, images.length - 1));
      setCurrentImageIndex(boundedIndex);
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      const nextIndex = (currentImageIndex + 1) % images.length;
      scrollToIndex(nextIndex);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
      scrollToIndex(prevIndex);
    }
  };

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setModalOpen(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tip details...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!tip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tip Not Found</h2>
          <p className="text-gray-600 mb-4">The tip you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Safe checks / Defaults
  const downloadLinks = Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [];
  const contentItems = Array.isArray(tip.content) ? tip.content : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Model Portfolio Header */}
          <div className="bg-[#1e3a8a] text-[#FFFFF0] rounded-t-xl px-6 py-4 mb-0">
            <h1 className="text-2xl font-bold text-center tracking-wide">
              MODEL PORTFOLIO
            </h1>
          </div>

          {/* Expert Recommendations Section */}
          <Card className="rounded-t-none border-t-0 mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  EXPERT RECOMMENDATIONS
                </h2>

                {/* Stock Info Card */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="bg-[#1e3a8a] text-[#FFFFF0] px-3 py-1 rounded text-sm font-medium mb-2 inline-block">
                        Model Portfolio
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {tip.stockId || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-600">NSE</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Weightage</p>
                      <div className={`rounded px-3 py-1 ${tip.action === "SELL"
                        ? "bg-red-50 border border-red-300"
                        : ["Partial Profit Booked", "PARTIAL SELL", "Partial Sell"].includes(tip.action || "")
                          ? "bg-orange-50 border border-orange-300"
                          : "bg-white border border-gray-300"
                        }`}>
                        <span className={`font-bold ${tip.action === "SELL"
                          ? "text-red-800"
                          : ["Partial Profit Booked", "PARTIAL SELL", "Partial Sell"].includes(tip.action || "")
                            ? "text-orange-800"
                            : "text-gray-900"
                          }`}>
                          {tip.targetPercentage || "4%"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  <span className="font-bold">Title:- </span>
                  {tip.title || "Untitled"}
                </h3>

                {/* Recommendation Details Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                  <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                    <h4 className="font-semibold">Recommendation Details</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Buy Range</h5>
                      <p className="text-green-600 font-bold text-lg">{tip.buyRange || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Add more at</h5>
                      <p className="text-green-600 font-bold text-lg">{tip.addMoreAt || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Action</h5>
                      <p className="text-green-600 font-bold text-lg">
                        {tip.action || "HOLD"}
                      </p>
                    </div>
                    <div className="text-center">
                      <h5 className="font-semibold text-gray-900 mb-2">Recommended Date</h5>
                      <p className="text-green-600 font-bold text-lg">
                        {formatDate(tip.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IMAGE CAROUSEL SECTION - Updated */}
          {images.length > 0 && (
            <Card className="mb-6 overflow-hidden">
              <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2">
                <h4 className="font-semibold flex items-center text-sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Analysis Charts
                </h4>
              </div>

              {/* Image Container with Arrows */}
              <div className="relative">
                {/* Left Arrow - Dark transparent overlay */}
                {images.length > 1 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}

                {/* Scroll Container - Snap scroll, no inner scrolling */}
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {images.map((imgSrc, index) => (
                    <div
                      key={index}
                      className="min-w-full flex-shrink-0 snap-center flex items-center justify-center bg-gray-50 h-[280px] md:h-[400px] cursor-pointer"
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={imgSrc}
                        alt={`Analysis Chart ${index + 1}`}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Right Arrow - Dark transparent overlay */}
                {images.length > 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
              </div>

              {/* Instagram-style dots at bottom */}
              {images.length > 1 && (
                <div className="flex justify-center items-center gap-1.5 py-3 bg-gray-100">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToIndex(idx)}
                      className={`rounded-full transition-all duration-200 ${idx === currentImageIndex
                        ? 'w-2 h-2 bg-blue-600'
                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                        }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Click to zoom hint */}
              <div className="text-center py-2 text-xs text-gray-500 bg-gray-50">
                Tap image to zoom
              </div>
            </Card>
          )}

          {/* Why Buy This Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                <h4 className="font-semibold">Why Buy This?</h4>
              </div>

              <div className="space-y-3">
                {typeof tip.content === 'string' ? (
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: tip.content }} />
                  </div>
                ) : contentItems.length > 0 ? (
                  contentItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">
                        {typeof item === 'string' ? item : item?.value || ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No detailed analysis available.</p>
                )}
              </div>

              {/* View Detailed Report Button */}
              <div className="text-center mt-6">
                {downloadLinks.length > 0 ? (
                  <Button
                    onClick={() => handleDownload(downloadLinks[0].url || downloadLinks[0].linkUrl)}
                    className="bg-green-600 hover:bg-green-700 text-[#FFFFF0] px-8 py-3 rounded-lg font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Detailed Report
                  </Button>
                ) : tip.tipUrl ? (
                  <Button
                    onClick={() => window.open(tip.tipUrl, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-[#FFFFF0] px-8 py-3 rounded-lg font-semibold"
                  >
                    View Detailed Report
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(tip.description || tip.horizon) && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="bg-[#1e3a8a] text-[#FFFFF0] px-4 py-2 rounded-lg inline-block mb-4">
                  <h4 className="font-semibold">Additional Information</h4>
                </div>

                <div className="space-y-4">
                  {tip.description && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                      <p className="text-gray-700">{tip.description}</p>
                    </div>
                  )}

                  {tip.horizon && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Investment Horizon</h5>
                      <p className="text-gray-700">{tip.horizon}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={images[modalImageIndex] || ''}
        imageIndex={modalImageIndex}
        totalImages={images.length}
      />
    </div>
  );
}