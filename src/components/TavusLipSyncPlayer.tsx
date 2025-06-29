import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TavusLipSyncPlayerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const TavusLipSyncPlayer: React.FC<TavusLipSyncPlayerProps> = ({
  videoUrl,
  isOpen = true,
  onClose,
  title = "AI Meditation Guide",
  subtitle = "Danny speaking"
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  console.log('TavusLipSyncPlayer render:', { isOpen, videoUrl, title, subtitle });

  // Handle dragging for compact mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return;
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 240, e.clientY - startY))
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-play when video loads
  useEffect(() => {
    console.log('TavusLipSyncPlayer useEffect - isOpen:', isOpen, 'videoUrl:', videoUrl);
    if (videoRef.current && isOpen && videoUrl) {
      console.log('TavusLipSyncPlayer: Setting up video with URL:', videoUrl);
      
      const video = videoRef.current;
      
      const handleCanPlay = () => {
        console.log('TavusLipSyncPlayer: Video can play');
        setIsLoading(false);
        video.play().catch(error => {
          console.error('TavusLipSyncPlayer: Error auto-playing video:', error);
        });
      };

      const handleLoadStart = () => {
        console.log('TavusLipSyncPlayer: Video load started');
        setIsLoading(true);
      };

      const handleError = (e: any) => {
        console.error('TavusLipSyncPlayer: Video error:', e);
        setIsLoading(false);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('error', handleError);
      
      // Force reload the video
      video.load();
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('error', handleError);
      };
    }
  }, [isOpen, videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

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
    console.log('TavusLipSyncPlayer: Not rendering - isOpen:', isOpen, 'videoUrl:', !!videoUrl);
    return null;
  }

  console.log('🎬 TavusLipSyncPlayer: Rendering with videoUrl:', videoUrl);
  console.log('🎬 TavusLipSyncPlayer: Props:', { isOpen, videoUrl: videoUrl.substring(0, 50) + '...', title, subtitle });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`fixed z-50 bg-black/95 backdrop-blur-sm rounded-xl border-2 border-cyan-400/70 shadow-2xl overflow-hidden ${
          isExpanded 
            ? "inset-4 md:inset-8" 
            : "cursor-move"
        }`}
        style={
          isExpanded 
            ? {} 
            : { 
                left: position.x, 
                top: position.y,
                width: '320px',
                height: '240px'
              }
        }
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-cyan-900/50 border-b border-cyan-400/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-white text-sm font-medium">{title}</h3>
              <p className="text-cyan-300 text-xs">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8 text-gray-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-8 w-8 text-gray-300 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-300 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Video Content */}
        <div className="relative flex-1 bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-cyan-300 text-sm">Loading Danny...</span>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={videoUrl}
            key={videoUrl} // Force re-render when URL changes
            autoPlay
            muted={isMuted}
            playsInline
            controls={false}
            className="w-full h-full object-cover bg-black"
            style={{ 
              height: isExpanded ? 'calc(100vh - 200px)' : '200px'
            }}
            onPlay={() => {
              console.log('Video started playing');
              setIsPlaying(true);
              setIsLoading(false);
            }}
            onPause={() => {
              console.log('Video paused');
              setIsPlaying(false);
            }}
            onEnded={() => {
              console.log('Video ended');
              setIsPlaying(false);
            }}
            onLoadStart={() => {
              console.log('TavusLipSyncPlayer: Video load started');
              setIsLoading(true);
            }}
            onCanPlay={() => {
              console.log('TavusLipSyncPlayer: Video can play');
              setIsLoading(false);
            }}
            onLoadedData={() => {
              console.log('TavusLipSyncPlayer: Video data loaded');
              setIsLoading(false);
            }}
            onError={(e) => {
              console.error('TavusLipSyncPlayer: Video error:', e);
              setIsLoading(false);
            }}
          />
          
          {/* Play/Pause Overlay */}
          {!isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={togglePlay}
            >
              <div className="bg-black/60 rounded-full p-3">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-cyan-300 text-xs">
              {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Paused"}
            </span>
          </div>

          {/* Danny Indicator */}
          <div className="absolute top-3 right-3 bg-cyan-400/20 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-cyan-300 text-xs font-medium">
              🎬 Danny
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};