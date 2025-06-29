import { createConversation } from "@/api";
import {
  DialogWrapper,
  AnimatedTextBlockWrapper,
  StaticTextBlockWrapper,
} from "@/components/DialogWrapper";
import { screenAtom } from "@/store/screens";
import { conversationAtom } from "@/store/conversation";
import React, { useCallback, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { AlertTriangle, Mic, Video } from "lucide-react";
import { useDaily, useDailyEvent, useDevices } from "@daily-co/daily-react";
import { ConversationError } from "./ConversationError";
import zoomSound from "@/assets/sounds/zoom.mp3";
import { Button } from "@/components/ui/button";
import { apiTokenAtom } from "@/store/tokens";
import { quantum } from 'ldrs';
import gloriaVideo from "@/assets/video/gloria.mp4";
import { VideoPopup } from "@/components/VideoPopup";
import { useVideoPopup } from "@/hooks/useVideoPopup";
import { Play } from "lucide-react";

// Register the quantum loader
quantum.register();

const useCreateConversationMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setScreenState] = useAtom(screenAtom);
  const [, setConversation] = useAtom(conversationAtom);
  const token = useAtomValue(apiTokenAtom);

  const createConversationRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!token) {
        throw new Error("API token is required. Please enter your Tavus API key in settings.");
      }
      
      if (token.trim() === '') {
        throw new Error("API token cannot be empty. Please enter a valid Tavus API key in settings.");
      }
      
      console.log("Creating conversation with token:", token ? "Token present" : "No token");
      const conversation = await createConversation(token);
      console.log("Conversation created successfully:", conversation);
      setConversation(conversation);
      setScreenState({ currentScreen: "conversation" });
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError(error instanceof Error ? error.message : "Failed to create conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createConversationRequest,
    setError,
  };
};

export const Instructions: React.FC = () => {
  const daily = useDaily();
  const { currentMic, setMicrophone, setSpeaker } = useDevices();
  const [, setScreenState] = useAtom(screenAtom);
  const { createConversationRequest, isLoading: isCreatingConversation, error: conversationError, setError } = useCreateConversationMutation();
  const [getUserMediaError, setGetUserMediaError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const audio = useMemo(() => {
    const audioObj = new Audio(zoomSound);
    audioObj.volume = 0.7;
    return audioObj;
  }, []);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const { 
    isVideoPopupOpen, 
    isVideoPlaying, 
    openVideoPopup, 
    closeVideoPopup, 
    toggleVideoPlay 
  } = useVideoPopup();

  useDailyEvent(
    "camera-error",
    useCallback(() => {
      setGetUserMediaError(true);
    }, []),
  );

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsPlayingSound(true);
      
      audio.currentTime = 0;
      await audio.play();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsPlayingSound(false);
      setIsLoadingConversation(true);
      
      let micDeviceId = currentMic?.device?.deviceId;
      if (!micDeviceId) {
        const res = await daily?.startCamera({
          startVideoOff: false,
          startAudioOff: false,
          audioSource: "default",
        });
        // @ts-expect-error deviceId exists in the MediaDeviceInfo
        const isDefaultMic = res?.mic?.deviceId === "default";
        // @ts-expect-error deviceId exists in the MediaDeviceInfo
        const isDefaultSpeaker = res?.speaker?.deviceId === "default";
        // @ts-expect-error deviceId exists in the MediaDeviceInfo
        micDeviceId = res?.mic?.deviceId;

        if (isDefaultMic) {
          if (!isDefaultMic) {
            setMicrophone("default");
          }
          if (!isDefaultSpeaker) {
            setSpeaker("default");
          }
        }
      }
      if (micDeviceId) {
        await createConversationRequest();
      } else {
        console.error("No microphone device ID found");
        setGetUserMediaError(true);
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to start session");
    } finally {
      setIsLoading(false);
      setIsLoadingConversation(false);
    }
  };

  if (isPlayingSound || isLoadingConversation) {
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
          <div className="flex flex-col items-center justify-center gap-4">
            <l-quantum
              size="45"
              speed="1.75"
              color="white"
            ></l-quantum>
            <p className="text-white text-lg">
              {isPlayingSound ? "Preparing your session..." : "Connecting to your meditation guide..."}
            </p>
          </div>
        </AnimatedTextBlockWrapper>
      </DialogWrapper>
    );
  }

  if (conversationError) {
    return (
      <DialogWrapper>
        <AnimatedTextBlockWrapper>
          <div className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-gray-300 text-center max-w-md mb-6">
              {conversationError}
            </p>
            {conversationError.includes("Invalid API token") && (
              <p className="text-yellow-300 text-center max-w-md mb-6 text-sm">
                💡 Get your API key from{" "}
                <a 
                  href="https://platform.tavus.io/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Tavus Platform
                </a>
              </p>
            )}
            <Button
              onClick={() => {
                setError(null);
                handleClick();
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Try Again
            </Button>
            <Button
              onClick={() => setScreenState({ currentScreen: "settings" })}
              variant="outline"
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Update API Key
            </Button>
            <button
              onClick={() => setScreenState({ currentScreen: "meditationOptions" })}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm underline"
            >
              ← Choose a different meditation style
            </button>
          </div>
        </AnimatedTextBlockWrapper>
      </DialogWrapper>
    );
  }

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
        <h1 
          className="mb-4 pt-1 text-center text-3xl sm:text-4xl lg:text-5xl font-semibold"
          style={{
            fontFamily: 'Source Code Pro, monospace'
          }}
        >
          <span className="text-white">Find Your</span>{" "}
          <span style={{
            color: '#9EEAFF'
          }}>Inner Peace</span>
        </h1>
        <p className="max-w-[650px] text-center text-base sm:text-lg text-gray-400 mb-12">
          Connect face-to-face with your AI meditation guide for personalized sessions, real-time emotional support, and interactive mindfulness coaching.
        </p>
        <Button
          onClick={handleClick}
          className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-8 py-2 text-sm text-white transition-all duration-200 hover:text-primary mb-12 disabled:opacity-50"
          disabled={isLoading || isCreatingConversation}
          style={{
            height: '48px',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Video className="size-5" />
          {isLoading || isCreatingConversation ? "Connecting..." : "Begin Meditation Session"}
          {getUserMediaError && (
            <div className="absolute -top-1 left-0 right-0 flex items-center gap-1 text-wrap rounded-lg border bg-red-500 p-2 text-white backdrop-blur-sm">
              <AlertTriangle className="text-red size-4" />
              <p>
                To connect with your meditation guide, please allow microphone access. Check your
                browser settings.
              </p>
            </div>
          )}
        </Button>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:gap-8 text-gray-400 justify-center">
          <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.2)] px-4 py-2 rounded-full">
            <Mic className="size-5 text-primary" />
            Voice interaction for guidance
          </div>
          <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.2)] px-4 py-2 rounded-full">
            <Video className="size-5 text-primary" />
            Face-to-face meditation coaching
          </div>
        </div>
        
        {/* Avatar Preview Option */}
        <div className="mb-8 text-center">
          <Button
            onClick={openVideoPopup}
            variant="outline"
            className="text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-white"
          >
            <Play className="size-4 mr-2" />
            Preview Your Guide First
          </Button>
        </div>
        
        <span className="absolute bottom-6 px-4 text-sm text-gray-500 sm:bottom-8 sm:px-8 text-center">
          By starting this video session, I accept the{' '}
          <a href="#" className="text-primary hover:underline">Terms of Use</a> and acknowledge the{' '}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          <br />
          <button
            onClick={() => setScreenState({ currentScreen: "meditationOptions" })}
            className="text-primary hover:underline text-sm mt-2"
          >
            ← Choose a different meditation style
          </button>
        </span>
      </AnimatedTextBlockWrapper>
      
      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={closeVideoPopup}
        avatarVideoSrc={gloriaVideo}
        isPlaying={isVideoPlaying}
        onTogglePlay={toggleVideoPlay}
        title="AI Meditation Guide Preview"
        subtitle="Your meditation companion"
      />
    </DialogWrapper>
  );
};

export const PositiveFeedback: React.FC = () => {
  return (
    <DialogWrapper>
      <AnimatedTextBlockWrapper>
        <StaticTextBlockWrapper
          imgSrc="/images/positive.png"
          title="Great Conversation!"
          titleClassName="sm:max-w-full bg-[linear-gradient(91deg,_#43BF8F_16.63%,_#FFF_86.96%)]"
          description="Thanks for the engaging discussion. Feel free to come back anytime for another chat!"
        />
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};
