import { DialogWrapper, AnimatedTextBlockWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const MeditationOptions: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);

  const handleChatBot = () => {
    setScreenState({ currentScreen: "chatInterface" });
  };

  return (
    <DialogWrapper>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-8 py-8">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4"
              style={{ fontFamily: 'Source Code Pro, monospace' }}
            >
              <span className="text-white">Welcome to</span>{" "}
              <span style={{ color: '#9EEAFF' }}>Mindful Moments</span>
            </h1>
            <p className="max-w-[650px] text-center text-base sm:text-lg text-gray-400">
              Start a conversation with your AI meditation guide for personalized support and guidance
            </p>
          </div>

          <div className="w-full max-w-md">
            {/* Chat Interface Option */}
            <Button
              onClick={handleChatBot}
              className="relative group flex flex-col items-center justify-center gap-4 p-8 h-auto rounded-2xl border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-primary w-full"
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
              <MessageCircle className="size-16 text-primary mb-2" />
              <h3 className="text-2xl font-semibold">Start Meditation Chat</h3>
              <p className="text-sm text-gray-300 text-center">
                Chat with Danny, your AI meditation guide with personalized video responses
              </p>
              <span className="text-xs text-primary font-medium">GET STARTED</span>
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
    </DialogWrapper>
  );
};