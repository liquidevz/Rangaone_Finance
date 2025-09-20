"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DigioIframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  digioUrl: string;
  title?: string;
}

export const DigioIframeModal: React.FC<DigioIframeModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  digioUrl,
  title = "Complete Digio Verification"
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {title}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 sm:p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Loading Digio verification...</p>
              </div>
            </div>
          )}

          {/* Iframe Container */}
          <div className="flex-1 relative bg-white">
            <iframe
              src={digioUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              allow="camera; microphone; geolocation"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
              title="Digio Verification"
            />
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 text-xs sm:text-sm text-gray-600">
                Complete the verification process above. Click "I'm Done" when finished.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                >
                  I'm Done
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};