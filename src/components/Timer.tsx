import { TIME_LIMIT } from "@/config";
import { getSessionTime } from "@/utils";
import { useEffect, useState } from "react";

const formatTime = (duration: number) => {
  if (!duration) return "0:00";

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

export const Timer = () => {
  const [time, setTime] = useState(() => {
    const sessionTime = getSessionTime();
    return TIME_LIMIT - sessionTime;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const sessionTime = getSessionTime();
      setTime(TIME_LIMIT - sessionTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute left-4 top-20 z-20 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white border border-gray-600">
      Time Remaining: {formatTime(time)}
    </div>
  );
};
