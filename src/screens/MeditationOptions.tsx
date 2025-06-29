import { DialogWrapper, AnimatedTextBlockWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { Video, MessageCircle, Headphones, BookOpen, Play } from "lucide-react";
import { VideoPopup } from "@/components/VideoPopup";
import { useVideoPopup } from "@/hooks/useVideoPopup";
import gloriaVideo from "@/assets/video/gloria.mp4";

export const MeditationOptions: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const { 
    isVideoPopupOpen, 
    isVideoPlaying, 
    openVideoPopup, 
    closeVideoPopup, 
    toggleVideoPlay 
  } = useVideoPopup();

  const handleVideoGuide = () => {
    setScreenState({ currentScreen: "instructions" });
  };

  const handleChatBot = () => {
    setScreenState({ currentScreen: "chatInterface" });
  };

  const handleGuidedReading = () => {
    // This would navigate to text-based meditation
    console.log("Guided reading selected");
  };

  const handleBreathingExercise = () => {
    // This would navigate to breathing exercises
    console.log("Breathing exercise selected");
  };

  return (
    <DialogWrapper>
      <video
        src={gloriaVideo}
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-8 py-8">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4"
              style={{ fontFamily: 'Source Code Pro, monospace' }}
            >
              <span className="text-white">Choose Your</span>{" "}
              <span style={{ color: '#9EEAFF' }}>Meditation Style</span>
            </h1>
            <p className="max-w-[650px] text-center text-base sm:text-lg text-gray-400">
              Select the type of meditation experience that feels right for you today
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* Chat Interface Option */}
            <Button
              onClick={handleChatBot}
              className="relative group flex flex-col items-center justify-center gap-4 p-8 h-auto rounded-2xl border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-primary"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 254, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <MessageCircle className="size-12 text-primary mb-2" />
              <h3 className="text-xl font-semibold">Chat with AI Guide</h3>
              <p className="text-sm text-gray-300 text-center">
                Text-based conversation with avatar popup option
              </p>
              <span className="text-xs text-primary font-medium">RECOMMENDED</span>
            </Button>

            {/* Video Guide Option */}
            <Button
              onClick={handleVideoGuide}
              className="relative group flex flex-col items-center justify-center gap-4 p-8 h-auto rounded-2xl border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-primary"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 254, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Video className="size-12 text-green-400 mb-2" />
              <h3 className="text-xl font-semibold">Direct Video Session</h3>
              <p className="text-sm text-gray-300 text-center">
                Jump straight into face-to-face meditation coaching
              </p>
            </Button>

            {/* Guided Reading Option */}
            <Button
              onClick={handleGuidedReading}
              className="relative group flex flex-col items-center justify-center gap-4 p-8 h-auto rounded-2xl border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-primary"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 254, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Headphones className="size-12 text-purple-400 mb-2" />
              <h3 className="text-xl font-semibold">Audio Meditation</h3>
              <p className="text-sm text-gray-300 text-center">
                Voice-guided sessions with calming background sounds
              </p>
            </Button>

            {/* Guided Reading Option */}
            <Button
              onClick={handleGuidedReading}
              className="relative group flex flex-col items-center justify-center gap-4 p-8 h-auto rounded-2xl border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-primary"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 254, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <BookOpen className="size-12 text-red-400 mb-2" />
              <h3 className="text-xl font-semibold">Guided Reading</h3>
              <p className="text-sm text-gray-300 text-center">
                Text-based meditation with mindfulness exercises
              </p>
            </Button>
          </div>

          {/* Quick Avatar Preview */}
          <div className="mt-6 text-center">
            <Button
              onClick={openVideoPopup}
              variant="outline"
              className="text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-white"
            >
              <Play className="size-4 mr-2" />
              Preview Your AI Guide
            </Button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setScreenState({ currentScreen: "intro" })}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm underline"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </AnimatedTextBlockWrapper>
      
      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={closeVideoPopup}
        avatarVideoSrc={gloriaVideo}
        isPlaying={isVideoPlaying}
        onTogglePlay={toggleVideoPlay}
        title="AI Meditation Guide Preview"
        subtitle="Meet your mindfulness companion"
      />
    </DialogWrapper>
  );
};