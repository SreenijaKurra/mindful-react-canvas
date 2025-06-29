import { cn } from "@/lib/utils";
import { DailyVideo, useVideoTrack } from "@daily-co/daily-react";

export default function Video({
  id,
  className,
  tileClassName,
}: {
  id: string;
  className?: string;
  tileClassName?: string;
}) {
  const videoState = useVideoTrack(id);

  return (
    <div
      className={cn("bg-black relative", className, {
        "hidden size-0": videoState.isOff,
      })}
    >
      <DailyVideo
        automirror
        sessionId={id}
        type="video"
        className={cn("size-full object-cover rounded-lg", tileClassName, {
          hidden: videoState.isOff,
        })}
      />
      {videoState.isOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <p className="text-white text-sm">Camera is off</p>
        </div>
      )}
    </div>
  );
}
