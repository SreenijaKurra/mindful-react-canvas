import React, { useState, useRef, useEffect } from "react";
import { DialogWrapper } from "@/components/DialogWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Video, Settings, Mic, MicOff, Volume2, VolumeX, Play } from "lucide-react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { settingsAtom } from "@/store/settings";
import { sendWebhookData } from "@/api/webhook";
import { VideoPopup } from "@/components/VideoPopup";
import { useVideoPopup } from "@/hooks/useVideoPopup";
import { createConversation } from "@/api";
import { apiTokenAtom } from "@/store/tokens";
import gloriaVideo from "@/assets/video/gloria.mp4";

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
  const [token] = useAtom(apiTokenAtom);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const { 
    isVideoPopupOpen, 
    isVideoPlaying, 
    openVideoPopup, 
    closeVideoPopup, 
    toggleVideoPlay 
  } = useVideoPopup();

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

    // Simple response logic - in a real app, this would call your AI service
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return "I understand you're feeling stressed. Let's try a simple breathing exercise: breathe in for 4 counts, hold for 4, then breathe out for 6. Would you like me to guide you through this in a video session where I can see how you're doing?";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      return "Sleep challenges can be really difficult. I can guide you through some relaxation techniques that might help. Would you like to try a personalized bedtime meditation? I can offer more tailored guidance if we switch to a video session.";
    }
    
    if (lowerMessage.includes('meditation') || lowerMessage.includes('mindfulness')) {
      return "Meditation is a wonderful practice! There are many different types - breathing meditation, body scans, loving-kindness meditation. What draws you to meditation? I can provide much more personalized guidance if you'd like to start a video session with me.";
    }
    
    if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('upset')) {
      return "It sounds like you're experiencing some difficult emotions. That's completely normal and valid. Sometimes it helps to acknowledge these feelings without judgment. Would you like to explore this together in a face-to-face video session where I can better support you?";
    }

    if (lowerMessage.includes('video') || lowerMessage.includes('face to face') || lowerMessage.includes('see you')) {
      return "I'd love to meet you face-to-face! Video sessions allow me to provide more personalized guidance, read your energy, and create a deeper connection. Click the video button below to start our live session.";
    }
    
    return "Thank you for sharing that with me. I'm here to support your wellness journey. For more personalized guidance and a deeper connection, would you like to switch to a video session where we can work together more closely?";
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
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      setIsPlayingAudio(true);
      
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
        };

        utterance.onerror = () => {
          setIsPlayingAudio(false);
        };

        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
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
  };

  const handlePlayVideo = async (text: string) => {
    if (!token) {
      console.error("No API token available for video generation");
      return;
    }

    try {
      setIsGeneratingVideo(true);
      
      // Create a Tavus conversation for this specific message
      const conversation = await createConversation(token);
      
      // For now, open the video popup with the avatar
      // In a full implementation, you would send the text to Tavus
      // and get back a personalized video response
      openVideoPopup();
      
      // Send analytics data
      await sendWebhookData({
        event_type: "video_response_requested",
        user_name: settings.name,
        timestamp: new Date().toISOString(),
        message_text: text,
        conversation_id: conversation.conversation_id,
        session_type: "chat_video_response"
      });
      
    } catch (error) {
      console.error("Error generating video response:", error);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <DialogWrapper>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      
      <div className="relative z-10 flex flex-col h-full max-h-[600px] w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-semibold">AI</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">Mindful Moments Guide</h2>
              <p className="text-gray-400 text-sm">Your AI meditation companion</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleVideoSession}
              title="Start Video Session"
              className="bg-black/20 border-gray-600 hover:bg-gray-700"
            >
              <Video className="size-5" />
            </Button>
            
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
                        onClick={() => isPlayingAudio ? stopAudio() : handlePlayAudio(message.text)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isPlayingAudio ? "Stop Audio" : "Listen to Audio"}
                      >
                        {isPlayingAudio ? (
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
                        title="Play Video Response"
                      >
                        {isGeneratingVideo ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="size-3" />
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
      
      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={closeVideoPopup}
        avatarVideoSrc={gloriaVideo}
        isPlaying={isVideoPlaying}
        onTogglePlay={toggleVideoPlay}
        title="AI Meditation Guide"
        subtitle="Video response"
      />
    </DialogWrapper>
  );
};