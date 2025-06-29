import React, { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  avatarVideoSrc: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  title?: string;
  subtitle?: string;
}

export const VideoPopup: React.FC<VideoPopupProps> = ({
  isOpen,
  onClose,
  avatarVideoSrc,
  isPlaying,
  onTogglePlay,
  title = "AI Meditation Guide",
  subtitle = "Speaking with you"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return; // Don't allow dragging when expanded
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          "fixed z-50 bg-black/90 backdrop-blur-sm rounded-xl border border-gray-600 shadow-2xl overflow-hidden",
          isExpanded 
            ? "inset-4 md:inset-8" 
            : "cursor-move"
        )}
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
        <div className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-white text-sm font-medium">{title}</h3>
              <p className="text-gray-400 text-xs">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
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
            src={avatarVideoSrc}
            autoPlay={isPlaying}
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ 
              height: isExpanded ? 'calc(100vh - 200px)' : '200px'
            }}
          />
          
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={onTogglePlay}
          >
            <div className="bg-black/60 rounded-full p-3">
              {isPlaying ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-1.5 h-4 bg-white rounded-sm mr-1"></div>
                  <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs">
              {isPlaying ? "Speaking..." : "Paused"}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};