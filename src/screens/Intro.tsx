import { AnimatedWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Unlock } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { apiTokenAtom } from "@/store/tokens";
import { Input } from "@/components/ui/input";
import gloriaVideo from "@/assets/video/gloria.mp4";

export const Intro: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [token, setToken] = useAtom(apiTokenAtom);

  const handleClick = () => {
    setScreenState({ currentScreen: "meditationOptions" });
  };

  return (
    <AnimatedWrapper>
      <div className="flex size-full flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        <div className="relative z-10 flex flex-col items-center gap-2 py-4 px-4 rounded-xl border border-[rgba(255,255,255,0.2)]" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            background: 'rgba(0,0,0,0.3)'
          }}>
          <img src="/public/images/vector.svg" alt="Logo" className="mt-2 mb-1" style={{ width: '40px', height: 'auto' }} />

          <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Source Code Pro, monospace' }}>Neuro</h1>

          <div className="flex flex-col gap-2 items-center mt-4">
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 mb-4">
              <p className="text-green-300 text-sm text-center">
                ✅ Demo Mode Active - API Key Configured
              </p>
            </div>

            <AudioButton 
              onClick={handleClick}
              className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-4 py-2 text-sm text-white transition-all duration-200 hover:text-primary mt-4 disabled:opacity-50"
              disabled={false}
              style={{
                height: '44px',
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
              <Unlock className="size-4" />
              Start Your Journey
            </AudioButton>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
};