import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LipSyncAvatarProps {
  isPlaying: boolean;
  text: string;
  onComplete?: () => void;
}

export const LipSyncAvatar: React.FC<LipSyncAvatarProps> = ({ 
  isPlaying, 
  text, 
  onComplete 
}) => {
  const [currentViseme, setCurrentViseme] = useState<string>('neutral');
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Viseme mapping for different mouth shapes
  const visemes = {
    neutral: 'M 50 60 Q 50 65 50 60',
    open: 'M 45 58 Q 50 70 55 58',
    wide: 'M 40 62 Q 50 65 60 62',
    small: 'M 48 60 Q 50 63 52 60',
    oh: 'M 47 58 Q 50 68 53 58',
    ee: 'M 42 61 Q 50 64 58 61',
    consonant: 'M 46 59 Q 50 62 54 59'
  };

  // Simple phoneme-to-viseme mapping
  const getVisemeForChar = (char: string): string => {
    const vowels = 'aeiouAEIOU';
    const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
    
    if (vowels.includes(char)) {
      if ('aA'.includes(char)) return 'open';
      if ('eE'.includes(char)) return 'ee';
      if ('iI'.includes(char)) return 'ee';
      if ('oO'.includes(char)) return 'oh';
      if ('uU'.includes(char)) return 'oh';
      return 'wide';
    } else if (consonants.includes(char)) {
      if ('bpmBPM'.includes(char)) return 'small';
      if ('fvFV'.includes(char)) return 'consonant';
      return 'consonant';
    }
    return 'neutral';
  };

  // Animate lip sync based on text
  useEffect(() => {
    if (isPlaying && text) {
      setIsAnimating(true);
      let charIndex = 0;
      const chars = text.split('');
      
      // Clear any existing intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate through characters
      intervalRef.current = setInterval(() => {
        if (charIndex < chars.length) {
          const char = chars[charIndex];
          const viseme = getVisemeForChar(char);
          setCurrentViseme(viseme);
          charIndex++;
        } else {
          // Animation complete
          setCurrentViseme('neutral');
          setIsAnimating(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onComplete?.();
        }
      }, 100); // Adjust speed as needed

      // Fallback timeout to ensure animation stops
      timeoutRef.current = setTimeout(() => {
        setCurrentViseme('neutral');
        setIsAnimating(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onComplete?.();
      }, text.length * 100 + 1000);

    } else {
      // Stop animation
      setCurrentViseme('neutral');
      setIsAnimating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, text, onComplete]);

  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Avatar face */}
      <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center relative overflow-hidden">
        {/* Eyes */}
        <div className="absolute top-6 left-0 right-0 flex justify-center gap-3">
          <motion.div 
            className="w-2 h-2 bg-white rounded-full"
            animate={isAnimating ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div 
            className="w-2 h-2 bg-white rounded-full"
            animate={isAnimating ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
          />
        </div>

        {/* Mouth with lip sync */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <svg width="20" height="15" viewBox="0 0 100 100" className="overflow-visible">
            <motion.path
              d={visemes[currentViseme as keyof typeof visemes]}
              fill="white"
              stroke="white"
              strokeWidth="2"
              animate={{ d: visemes[currentViseme as keyof typeof visemes] }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Speaking indicator */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
            >
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sound waves animation */}
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute border-2 border-cyan-300 rounded-full"
                initial={{ width: 24, height: 24, opacity: 0.7 }}
                animate={{ 
                  width: [24, 40, 60], 
                  height: [24, 40, 60], 
                  opacity: [0.7, 0.3, 0] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};