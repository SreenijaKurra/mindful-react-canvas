import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoVideoPopupProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
}

export const AutoVideoPopup: React.FC<AutoVideoPopupProps> = ({
  videoUrl,
  isOpen,
  onClose,
  title = "AI Response",
  subtitle = "Generated video response",
  autoPlay = true
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  console.log('AutoVideoPopup render:', { isOpen, videoUrl, title, subtitle });

  // Auto-play when video loads
  useEffect(() => {
    if (videoRef.current && isOpen && videoUrl) {
      console.log('AutoVideoPopup: Setting up video with URL:', videoUrl);
      
      const video = videoRef.current;
      
      const handleCanPlay = () => {
        console.log('AutoVideoPopup: Video can play');
        setIsLoading(false);
        setHasError(false);
        if (autoPlay) {
          video.play().catch(error => {
            console.error('AutoVideoPopup: Error auto-playing video:', error);
          });
        }
      };

      const handleLoadStart = () => {
        console.log('AutoVideoPopup: Video load started');
        setIsLoading(true);
        setHasError(false);
      };

      const handleError = (e: any) => {
        console.error('AutoVideoPopup: Video error:', e);
        console.error('Video element error details:', e.currentTarget.error);
        setIsLoading(false);
        setHasError(true);
      };

      const handleLoadedData = () => {
        console.log('AutoVideoPopup: Video data loaded');
        setIsLoading(false);
        setHasError(false);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('error', handleError);
      video.addEventListener('loadeddata', handleLoadedData);
      
      // Force reload the video
      video.load();
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [isOpen, videoUrl, autoPlay]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isOpen || !videoUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`absolute bg-black/95 backdrop-blur-sm rounded-xl border-2 border-cyan-400/70 shadow-2xl overflow-hidden pointer-events-auto ${
            isExpanded 
              ? "inset-4 md:inset-8 w-auto h-auto" 
              : "bottom-4 right-4 w-80 h-60"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-cyan-900/80 border-b border-cyan-400/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-white text-sm font-medium">{title}</h3>
                <p className="text-cyan-300 text-xs truncate max-w-48">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-7 w-7 text-gray-300 hover:text-white"
              >
                {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpand}
                className="h-7 w-7 text-gray-300 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-gray-300 hover:text-white"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>

          {/* Video Content */}
          <div className="relative flex-1 bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-cyan-300 text-xs">Loading video...</span>
                </div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <div className="text-red-400 text-2xl">⚠️</div>
                  <span className="text-red-300 text-xs">Failed to load video</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasError(false);
                      setIsLoading(true);
                      videoRef.current?.load();
                    }}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              src={videoUrl}
              key={videoUrl}
              autoPlay={autoPlay}
              muted={isMuted}
              playsInline
              controls={true}
              className="w-full h-full object-cover bg-black"
              crossOrigin="anonymous"
              preload="auto"
              onPlay={() => console.log('AutoVideoPopup: Video started playing')}
              onPause={() => console.log('AutoVideoPopup: Video paused')}
              onEnded={() => console.log('AutoVideoPopup: Video ended')}
              onTimeUpdate={() => {
                // Optional: track video progress
              }}
            />

            {/* Status Indicator */}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="text-cyan-300 text-xs">
                {isLoading ? "Loading..." : hasError ? "Error" : "Playing"}
              </span>
            </div>

            {/* AI Indicator */}
            <div className="absolute top-2 right-2 bg-cyan-400/20 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="text-cyan-300 text-xs font-medium">
                🤖 AI Generated
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};