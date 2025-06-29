import { DialogWrapper, AnimatedTextBlockWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { sendWebhookData } from "@/api/webhook";
import { settingsAtom } from "@/store/settings";
import { useState } from "react";

export const FinalScreen: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [settings] = useAtom(settingsAtom);
  const [feedback, setFeedback] = useState("");
  const [emotionalState, setEmotionalState] = useState("");

  const handleReturn = () => {
    // Send final session feedback to webhook
    if (feedback || emotionalState) {
      sendWebhookData({
        event_type: "meditation_session_feedback",
        user_name: settings.name,
        timestamp: new Date().toISOString(),
        user_feedback: feedback,
        emotional_state: emotionalState,
        session_type: "guided_meditation"
      }).catch(console.error);
    }
    
    setScreenState({ currentScreen: "intro" });
  };

  return (
    <DialogWrapper>
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Thank you for your meditation session!</h1>
          
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                How are you feeling now?
              </label>
              <select
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                className="w-full p-2 rounded-md bg-black/20 text-white border border-gray-600"
              >
                <option value="">Select your current state</option>
                <option value="peaceful">Peaceful</option>
                <option value="relaxed">Relaxed</option>
                <option value="centered">Centered</option>
                <option value="calm">Calm</option>
                <option value="grateful">Grateful</option>
                <option value="energized">Energized</option>
                <option value="still_stressed">Still feeling stressed</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Any feedback about your session? (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about the meditation session..."
                className="w-full p-2 rounded-md bg-black/20 text-white border border-gray-600 h-20 resize-none"
              />
            </div>
          </div>
          
          <Button
            onClick={handleReturn}
            className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-8 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
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
            Return to Meditation Home
          </Button>
        </div>
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};
