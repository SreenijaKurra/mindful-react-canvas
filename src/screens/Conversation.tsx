import { DialogWrapper } from "@/components/DialogWrapper";
import {
  DailyAudio,
  useDaily,
  useLocalSessionId,
  useParticipantIds,
  useVideoTrack,
  useAudioTrack,
} from "@daily-co/daily-react";
import React, { useCallback, useEffect, useState } from "react";
import Video from "@/components/Video";
import { conversationAtom } from "@/store/conversation";
import { useAtom, useAtomValue } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { endConversation } from "@/api/endConversation";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneIcon,
} from "lucide-react";
import {
  clearSessionTime,
  getSessionTime,
  setSessionStartTime,
  updateSessionEndTime,
} from "@/utils";
import { Timer } from "@/components/Timer";
import { TIME_LIMIT } from "@/config";
import { niceScoreAtom } from "@/store/game";
import { naughtyScoreAtom } from "@/store/game";
import { apiTokenAtom } from "@/store/tokens";
import { quantum } from 'ldrs';
import { cn } from "@/lib/utils";
import { sendWebhookData } from "@/api/webhook";
import { useDailyEvent } from "@daily-co/daily-react";

quantum.register();

const timeToGoPhrases = [
  "Our meditation session is coming to a close. Let's take a moment to reflect on what we've shared.",
  "We have a few more minutes together. Is there anything else about your practice you'd like to explore?",
  "Our time is almost up. How are you feeling right now, and what would you like to take with you from our session?",
];

const outroPhrases = [
  "Thank you for sharing this meditation journey with me. Remember to be gentle with yourself, and I'll be here whenever you need guidance.",
  "Our session is complete. Take these moments of peace with you, and remember that your practice is always available to you.",
  "It's been wonderful guiding you today. May you carry this sense of calm and awareness with you. Until we meet again, be well.",
];

export const Conversation: React.FC = () => {
  const [conversation, setConversation] = useAtom(conversationAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const [naughtyScore] = useAtom(naughtyScoreAtom);
  const [niceScore] = useAtom(niceScoreAtom);
  const token = useAtomValue(apiTokenAtom);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [conversationTranscript, setConversationTranscript] = useState<string[]>([]);

  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const [start, setStart] = useState(false);

  // Listen for conversation events to capture transcripts and emotional state
  useDailyEvent(
    "app-message",
    useCallback((ev: any) => {
      if (ev.data?.event_type === "conversation.speech") {
        const transcript = ev.data?.properties?.text;
        if (transcript) {
          setConversationTranscript(prev => [...prev, transcript]);
        }
      }
      
      // Capture emotional indicators or meditation-related events
      if (ev.data?.event_type === "conversation.tool_call") {
        const properties = ev.data?.properties;
        if (properties) {
          // Send real-time meditation data to webhook
          sendWebhookData({
            event_type: "meditation_interaction",
            conversation_id: conversation?.conversation_id,
            timestamp: new Date().toISOString(),
            interaction_data: properties
          }).catch(console.error);
        }
      }
    }, [conversation?.conversation_id])
  );
  useEffect(() => {
    if (remoteParticipantIds.length && !start) {
      setStart(true);
      setSessionStartTime(Date.now());
      setTimeout(() => daily?.setLocalAudio(true), 4000);
    }
  }, [remoteParticipantIds, start]);

  useEffect(() => {
    if (!remoteParticipantIds.length || !start) return;

    setSessionStartTime();
    const interval = setInterval(() => {
      const time = getSessionTime();
      if (time === TIME_LIMIT - 60) {
        daily?.sendAppMessage({
          message_type: "conversation",
          event_type: "conversation.echo",
          conversation_id: conversation?.conversation_id,
          properties: {
            modality: "text",
            text:
              timeToGoPhrases[Math.floor(Math.random() * 3)] ??
              timeToGoPhrases[0],
          },
        });
      }
      if (time === TIME_LIMIT - 10) {
        daily?.sendAppMessage({
          message_type: "conversation",
          event_type: "conversation.echo",
          conversation_id: conversation?.conversation_id,
          properties: {
            modality: "text",
            text:
              outroPhrases[Math.floor(Math.random() * 3)] ?? outroPhrases[0],
          },
        });
      }
      if (time >= TIME_LIMIT) {
        leaveConversation();
        clearInterval(interval);
      } else {
        updateSessionEndTime();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [remoteParticipantIds, start]);

  useEffect(() => {
    if (conversation?.conversation_url) {
      daily
        ?.join({
          url: conversation.conversation_url,
          startVideoOff: false,
          startAudioOff: true,
        })
        .then(() => {
          daily?.setLocalVideo(true);
          daily?.setLocalAudio(false);
        });
    }
  }, [conversation?.conversation_url]);

  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!isCameraEnabled);
  }, [daily, isCameraEnabled]);

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!isMicEnabled);
  }, [daily, isMicEnabled]);

  const leaveConversation = useCallback(() => {
    const sessionDuration = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;
    
    // Send session end data to webhook
    if (conversation?.conversation_id) {
      sendWebhookData({
        event_type: "meditation_session_ended",
        conversation_id: conversation.conversation_id,
        timestamp: new Date().toISOString(),
        session_duration: Math.round(sessionDuration),
        conversation_summary: conversationTranscript.join(" "),
        session_type: "guided_meditation"
      }).catch(console.error);
    }
    
    daily?.leave();
    daily?.destroy();
    if (conversation?.conversation_id && token) {
      endConversation(token, conversation.conversation_id);
    }
    setConversation(null);
    clearSessionTime();

    const naughtyScorePositive = Math.abs(naughtyScore);
    if (naughtyScorePositive > niceScore) {
      setScreenState({ currentScreen: "finalScreen" });
    } else {
      setScreenState({ currentScreen: "finalScreen" });
    }
  }, [daily, token]);

  return (
    <DialogWrapper>
      <div className="absolute inset-0 size-full">
        {remoteParticipantIds?.length > 0 ? (
          <>
            <Timer />
            <div className="relative size-full">
              <Video
                id={remoteParticipantIds[0]}
                className="size-full"
                tileClassName="!object-cover"
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <Button
                  size="icon"
                  className="bg-red-600 hover:bg-red-700 border-2 border-white shadow-lg"
                  onClick={leaveConversation}
                  title="End Session"
                >
                  <PhoneIcon className="size-6 rotate-[135deg] text-white" />
                </Button>
              </div>
              
              {/* Session Info */}
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-medium">Live Meditation Session</p>
                <p className="text-gray-300 text-xs">Click the red button to end</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <l-quantum
              size="45"
              speed="1.75"
              color="white"
            ></l-quantum>
          </div>
        )}
        {localSessionId && (
          <Video
            id={localSessionId}
            tileClassName="!object-cover"
            className={cn(
              "absolute bottom-24 right-4 aspect-video h-32 w-24 overflow-hidden rounded-lg border-2 border-[#22C5FE] shadow-[0_0_20px_rgba(34,197,254,0.3)] sm:bottom-20 sm:h-40 sm:w-32 lg:h-48 lg:w-36"
            )}
          />
        )}
        
        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex justify-center gap-3 bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
          <Button
            size="icon"
            className="bg-gray-700 hover:bg-gray-600 border border-gray-500"
            variant="secondary"
            onClick={toggleAudio}
            title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {!isMicEnabled ? (
              <MicOffIcon className="size-5 text-red-400" />
            ) : (
              <MicIcon className="size-5 text-green-400" />
            )}
          </Button>
          
          <Button
            size="icon"
            className="bg-gray-700 hover:bg-gray-600 border border-gray-500"
            variant="secondary"
            onClick={toggleVideo}
            title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {!isCameraEnabled ? (
              <VideoOffIcon className="size-5 text-red-400" />
            ) : (
              <VideoIcon className="size-5 text-green-400" />
            )}
          </Button>
          
          <Button
            size="icon"
            className="bg-red-600 hover:bg-red-700 border-2 border-white shadow-lg"
            onClick={leaveConversation}
            title="End meditation session"
          >
            <PhoneIcon className="size-5 rotate-[135deg] text-white" />
          </Button>
        </div>
        
        <DailyAudio />
      </div>
    </DialogWrapper>
  );
};