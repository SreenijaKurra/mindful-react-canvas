import React, { useState, useRef, useEffect } from "react";
import { DialogWrapper } from "@/components/DialogWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Video, Settings, Mic, MicOff, Volume2, VolumeX, Play } from "lucide-react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { settingsAtom } from "@/store/settings";
import { sendWebhookData } from "@/api/webhook";
import { generateAIResponse, generateTavusLipSyncVideo, getTavusVideoStatus } from "@/api";
import { apiTokenAtom } from "@/store/tokens";
import { TavusLipSyncPlayer } from "@/components/TavusLipSyncPlayer";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI meditation guide. How are you feeling today? You can ask me about meditation techniques, stress relief, mindfulness practices, or anything else on your mind.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [, setScreenState] = useAtom(screenAtom);
  const [settings] = useAtom(settingsAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState<string | null>(null);
  const [token] = useAtom(apiTokenAtom);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const [isTavusPlayerOpen, setIsTavusPlayerOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentVideoText, setCurrentVideoText] = useState<string>("");

  // Debug logging for video popup state
  useEffect(() => {
    console.log('Video popup state:', {
      isTavusPlayerOpen,
      tavusVideoUrl,
      isGeneratingVideo,
      videoError
    });
  }, [isTavusPlayerOpen, tavusVideoUrl, isGeneratingVideo, videoError]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    // Send user query to webhook
    try {
      await sendWebhookData({
        event_type: "chat_message",
        user_name: settings.name,
        timestamp: new Date().toISOString(),
        user_message: userMessage,
        session_type: "text_chat"
      });
    } catch (error) {
      // Webhook errors are now handled silently in the webhook module
      // No need to log here as it's already logged as a warning
    }

    // Use OpenAI to generate intelligent responses
    return await generateAIResponse(userMessage, settings.name);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVideoSession = () => {
    // Send video session start event to webhook
    sendWebhookData({
      event_type: "video_session_requested",
      user_name: settings.name,
      timestamp: new Date().toISOString(),
      previous_messages: messages.length,
      session_type: "video_escalation"
    }).catch(console.error);

    setScreenState({ currentScreen: "instructions" });
  };

  const handleVoiceInput = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    } else if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    // Stop any currently playing audio
    setCurrentSpeakingMessage(null);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      setIsPlayingAudio(true);
      setCurrentSpeakingMessage(text);
      
      // Use Web Speech API for text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Try to use a female voice if available
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onend = () => {
          setIsPlayingAudio(false);
          setCurrentSpeakingMessage(null);
        };

        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setCurrentSpeakingMessage(null);
        };

        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      setCurrentSpeakingMessage(null);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setCurrentSpeakingMessage(null);
  };

  const handlePlayVideo = async (text: string) => {
    console.log('handlePlayVideo called with text:', text);
    setVideoError(null); // Clear any previous errors
    setIsGeneratingVideo(true);
    setCurrentVideoText(text); // Store the text being processed
    
    if (!token) {
      setVideoError("No API token available. Please configure your API key in settings.");
      setIsGeneratingVideo(false);
      return;
    }

    try {
      console.log('Generating Tavus lip sync video for text:', text);
      
      // Generate lip sync video using Tavus API with your persona
      const videoResponse = await generateTavusLipSyncVideo(token, text);
      console.log('Video generation response:', videoResponse);
      
      // Poll for video completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait time
      
      const pollVideoStatus = async (): Promise<void> => {
        try {
          const statusResponse = await getTavusVideoStatus(token, videoResponse.video_id);
          console.log('Video status:', statusResponse);
          
          if (statusResponse.status === 'completed' && statusResponse.video_url) {
            setTavusVideoUrl(statusResponse.video_url);
            console.log('Setting video URL and opening player:', statusResponse.video_url);
            setIsTavusPlayerOpen(true);
            setIsGeneratingVideo(false);
            
            console.log('Opening Tavus player with video URL:', statusResponse.video_url);
            
            // Send analytics data
            await sendWebhookData({
              event_type: "tavus_lip_sync_completed",
              user_name: settings.name,
              timestamp: new Date().toISOString(),
              message_text: text,
              video_id: videoResponse.video_id,
              video_url: statusResponse.video_url,
              session_type: "chat_lip_sync_response"
            });
            
          } else if (statusResponse.status === 'failed') {
            throw new Error('Video generation failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollVideoStatus, 10000); // Check every 10 seconds
          } else {
            throw new Error('Video generation timed out');
          }
        } catch (error) {
          console.error('Error checking video status:', error);
          setVideoError('Failed to generate video. Please try again.');
          setIsGeneratingVideo(false);
        }
      };
      
      // Start polling after initial delay
      setTimeout(pollVideoStatus, 5000);
      
      // Send analytics data
      await sendWebhookData({
        event_type: "tavus_lip_sync_requested",
        user_name: settings.name,
        timestamp: new Date().toISOString(),
        message_text: text,
        video_id: videoResponse.video_id,
        session_type: "chat_lip_sync_response"
      });
      
    } catch (error) {
      console.error("Error generating lip sync video:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate lip sync video";
      setVideoError(errorMessage);
      setIsGeneratingVideo(false);
      
      // If it's a concurrent videos error, provide additional guidance
      if (errorMessage.includes("maximum number of active video")) {
        // Auto-clear the error after 10 seconds to reduce UI clutter
        setTimeout(() => {
          setVideoError(null);
        }, 10000);
      }
    }
  };

  return (
    <DialogWrapper>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      
      <div className="relative z-10 flex flex-col h-full max-h-[600px] w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-black/20 backdrop-blur-sm relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-semibold">AI</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">Mindful Moments Guide</h2>
              <p className="text-gray-400 text-sm">Danny - Your AI Guide (Persona: {settings.persona})</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScreenState({ currentScreen: "settings" })}
              title="Settings"
              className="bg-black/20 border-gray-600 hover:bg-gray-700"
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10 backdrop-blur-sm">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl relative group ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800/80 text-white backdrop-blur-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  {/* Audio button for bot messages */}
                  {message.sender === 'bot' && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isPlayingAudio && currentSpeakingMessage === message.text) {
                            stopAudio();
                          } else {
                            handlePlayAudio(message.text);
                          }
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isPlayingAudio && currentSpeakingMessage === message.text ? "Stop Audio" : "Listen to Audio"}
                      >
                        {isPlayingAudio && currentSpeakingMessage === message.text ? (
                          <VolumeX className="size-3" />
                        ) : (
                          <Volume2 className="size-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlayVideo(message.text)}
                        disabled={isGeneratingVideo}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Generate Lip Sync Video"
                      >
                        {isGeneratingVideo ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Video className="size-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 text-white p-3 rounded-2xl backdrop-blur-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-black/20 backdrop-blur-sm">
          {/* Video Error Alert */}
          {videoError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-red-200 text-sm">{videoError}</p>
                  {videoError.includes("maximum number of active video") && (
                    <p className="text-red-300 text-xs mt-1 opacity-80">
                      💡 Tip: Wait for current video generations to complete, or try again in a few minutes.
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVideoError(null)}
                  className="h-6 w-6 text-red-200 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about meditation, stress relief, mindfulness..."
                className="bg-gray-800/50 border-gray-600 text-white pr-12 backdrop-blur-sm"
                style={{ fontFamily: "'Source Code Pro', monospace" }}
              />
              {recognition && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceInput}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 ${
                    isListening ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="px-4 bg-primary hover:bg-primary/90"
            >
              <Send className="size-4" />
            </Button>
          </div>
          
        </div>
      </div>
      
      {/* Tavus Lip Sync Player */}
      {tavusVideoUrl && isTavusPlayerOpen && (
        <TavusLipSyncPlayer
          videoUrl={tavusVideoUrl}
          isOpen={true}
          onClose={() => {
            console.log('Closing Tavus player');
            setIsTavusPlayerOpen(false);
            setTavusVideoUrl(null);
            setCurrentVideoText("");
          }}
          title="Danny - Your AI Guide"
          subtitle={`Speaking: "${currentVideoText.substring(0, 30)}${currentVideoText.length > 30 ? '...' : ''}"`}
        />
      )}
    </DialogWrapper>
  );
};