import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
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
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Handle dragging for compact mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return;
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
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
      console.log('TavusLipSyncPlayer: Loading video URL:', videoUrl);
      videoRef.current.load(); // Reload the video element
      
      // Wait a moment for the video to load, then play
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          console.log('TavusLipSyncPlayer: Video started playing');
        } catch (error) {
          console.error('TavusLipSyncPlayer: Error playing video:', error);
        }
      };
      
      // Small delay to ensure video is loaded
      setTimeout(playVideo, 500);
    }
  }, [isOpen, videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
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

  console.log('TavusLipSyncPlayer: Rendering with videoUrl:', videoUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed z-50 bg-black/90 backdrop-blur-sm rounded-xl border border-cyan-400/50 shadow-2xl overflow-hidden ${
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
        <div className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-cyan-400/30">
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
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              {isExpanded ? "⊟" : "⊞"}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Video Content */}
        <div className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted={isMuted}
            playsInline
            controls={false}
            className="w-full h-full object-cover"
            style={{ 
              height: isExpanded ? 'calc(100vh - 200px)' : '200px'
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onLoadStart={() => console.log('TavusLipSyncPlayer: Video load started')}
            onCanPlay={() => console.log('TavusLipSyncPlayer: Video can play')}
            onError={(e) => console.error('TavusLipSyncPlayer: Video error:', e)}
          />
          
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-black/60 rounded-full p-3">
              {isPlaying ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-1.5 h-4 bg-white rounded-sm mr-1"></div>
                  <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                </div>
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-cyan-300 text-xs">
              {isPlaying ? "Playing..." : "Paused"}
            </span>
          </div>

          {/* Lip Sync Indicator */}
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