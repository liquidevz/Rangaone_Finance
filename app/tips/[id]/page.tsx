"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, AlertCircle, ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { tipsService, Tip } from "@/services/tip.service";
import { useAuth } from "@/components/auth/auth-context";

import { useSecureImage } from "@/hooks/use-secure-image";

interface ExtendedTip extends Tip {
  images?: any[];
}

// Helper function to convert raw buffer objects to base64 strings
// Helper function to validate image URLs
function processImages(rawImages: any[]): string[] {
  if (!Array.isArray(rawImages)) return [];
  return rawImages.filter((img): img is string => typeof img === 'string' && img.length > 0);
}

// Carousel Image with Loading Spinner
// Carousel Image with Loading Spinner and Secure Fetch
function CarouselImage({ src, index, onClick }: { src: string; index: number; onClick: () => void }) {
  const { objectUrl, isLoading, error } = useSecureImage(src);

  return (
    <div
      className="min-w-full flex-shrink-0 snap-center flex items-center justify-center bg-gray-50 h-[280px] md:h-[400px] cursor-pointer relative"
      onClick={onClick}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {objectUrl && (
        <img
          src={objectUrl}
          alt={`Analysis Chart ${index + 1}`}
          className={`max-w-full max-h-full object-contain pointer-events-none select-none transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          draggable={false}
        />
      )}
    </div>
  );
}



// Image Modal Component with Zoom
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
  // Securely fetch the modal image
  const { objectUrl, isLoading, error } = useSecureImage(isOpen ? imageSrc : null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <div className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-auto">
          {imageIndex + 1} / {totalImages}
        </div>
        {/* Solid Black Close Button */}
        <button
          onClick={onClose}
          className="p-2 bg-black hover:bg-gray-900 rounded-full text-white shadow-lg pointer-events-auto transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
        {/* Modal Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm text-white/80">Loading high-res...</span>
            </div>
          </div>
        )}

        {/* Modal Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-white/80">Failed to load image</span>
          </div>
        )}

        {objectUrl && (
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit={true}
            centerZoomedOut={true}
            limitToBounds={true}
            smooth={true}
            wheel={{ step: 0.2 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  contentStyle={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "auto",
                    height: "auto",
                  }}
                >
                  <img
                    src={objectUrl}
                    alt={`Image ${imageIndex + 1}`}
                    className="max-w-[95vw] max-h-[85vh] object-contain shadow-2xl"
                    draggable={false}
                  />
                </TransformComponent>

                {/* Floating Bottom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 pointer-events-auto">
                  <div className="flex bg-black/60 backdrop-blur-md rounded-full px-4 py-2 gap-4 border border-white/10">
                    <button
                      onClick={() => zoomOut()}
                      className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-1"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <div className="w-px h-5 bg-white/20"></div>
                    <button
                      onClick={() => resetTransform()}
                      className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-1"
                      title="Reset"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <div className="w-px h-5 bg-white/20"></div>
                    <button
                      onClick={() => zoomIn()}
                      className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-1"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </TransformWrapper>
        )}
      </div>
    </div>
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
    if (params?.id) {
      loadTipDetails(params.id as string);
    }
  }, [params?.id]);

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
                    <CarouselImage
                      key={index}
                      src={imgSrc}
                      index={index}
                      onClick={() => openImageModal(index)}
                    />
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