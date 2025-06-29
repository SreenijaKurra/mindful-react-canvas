import { useState, useCallback } from "react";

export const useVideoPopup = () => {
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const openVideoPopup = useCallback(() => {
    setIsVideoPopupOpen(true);
    setIsVideoPlaying(true);
  }, []);

  const closeVideoPopup = useCallback(() => {
    setIsVideoPopupOpen(false);
    setIsVideoPlaying(false);
  }, []);

  const toggleVideoPlay = useCallback(() => {
    setIsVideoPlaying(prev => !prev);
  }, []);

  return {
    isVideoPopupOpen,
    isVideoPlaying,
    openVideoPopup,
    closeVideoPopup,
    toggleVideoPlay,
  };
};