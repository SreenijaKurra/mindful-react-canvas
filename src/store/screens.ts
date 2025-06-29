import { atom } from "jotai";

export type Screen =
  | "introLoading"
  | "outage"
  | "outOfMinutes"
  | "intro"
  | "meditationOptions"
  | "instructions"
  | "settings"
  | "conversation"
  | "conversationError"
  | "positiveFeedback"
  | "negativeFeedback"
  | "finalScreen"
  | "sessionEnded";

interface ScreenState {
  currentScreen: Screen;
}

const initialScreenState: ScreenState = {
  currentScreen: "introLoading",
};

export const screenAtom = atom<ScreenState>(initialScreenState);
