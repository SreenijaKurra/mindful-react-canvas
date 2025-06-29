import { atom } from "jotai";

interface Settings {
  name: string;
  language: string;
  interruptSensitivity: string;
  greeting: string;
  context: string;
  persona: string;
  replica: string;
}

const getInitialSettings = (): Settings => {
  const savedSettings = localStorage.getItem('tavus-settings');
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  return {
    name: "",
    language: "en",
    interruptSensitivity: "medium",
    greeting: "",
    context: "",
    persona: "p5bf051443c7",
    replica: "",
  };
};

export const settingsAtom = atom<Settings>(getInitialSettings());

export const settingsSavedAtom = atom<boolean>(false); 