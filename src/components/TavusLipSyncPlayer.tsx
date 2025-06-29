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
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`absolute bg-black/95 backdrop-blur-sm rounded-xl border-2 border-cyan-400/70 shadow-2xl overflow-hidden pointer-events-auto ${
          isExpanded 
            ? "inset-4 md:inset-8 w-auto h-auto" 
            : "cursor-move w-80 h-60"
        }`}
        style={
          isExpanded 
            ? {} 
            : { 
                left: position.x, 
                top: position.y,
              }
        }
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 bg-cyan-900/80 border-b border-cyan-400/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-white text-xs font-medium">{title}</h3>
              <p className="text-cyan-300 text-[10px] truncate max-w-32">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-6 w-6 text-gray-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-6 w-6 text-gray-300 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-gray-300 hover:text-white"
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
                <span className="text-cyan-300 text-xs">Loading...</span>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={videoUrl}
            key={videoUrl} // Force re-render when URL changes
            autoPlay={true}
            muted={false}
            playsInline
            controls={true}
            className="w-full h-full object-cover bg-black"
            crossOrigin="anonymous"
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
              console.error('Video element error details:', e.currentTarget.error);
              setIsLoading(false);
            }}
          />
          
          {/* Play/Pause Overlay */}
          {!isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={togglePlay}
            >
              <div className="bg-black/70 rounded-full p-2">
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="text-cyan-300 text-[10px]">
              {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Paused"}
            </span>
          </div>

          {/* Danny Indicator */}
          <div className="absolute top-2 right-2 bg-cyan-400/20 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="text-cyan-300 text-[10px] font-medium">
              🎬 Danny
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};