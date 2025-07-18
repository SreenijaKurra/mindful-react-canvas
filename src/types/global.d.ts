interface Window {
  grecaptcha?: {
    enterprise?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  };
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  speechSynthesis?: SpeechSynthesis;
}

declare var SpeechRecognition: any;