import { atom } from "jotai";

// DEVELOPMENT ONLY - API key hardcoded for demo
const DEMO_API_KEY = "57d74927dd6148f19c081364a7d1e024";

// Get initial token from localStorage
const getInitialToken = (): string | null => {
  try {
    // For demo purposes, always return the hardcoded key
    return DEMO_API_KEY;
    
    // Original localStorage logic (commented out for demo)
    /*
    const savedToken = localStorage.getItem('tavus-token');
    return savedToken && savedToken.trim() !== '' ? savedToken.trim() : null;
    */
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return DEMO_API_KEY;
  }
};

// Atom to store the API token
export const apiTokenAtom = atom<string | null>(DEMO_API_KEY);

// Atom to track if token is being validated
export const isValidatingTokenAtom = atom(false);

// Derived atom to check if token exists
export const hasTokenAtom = atom((get) => true); // Always true for demo

// Action atom to set token
export const setApiTokenAtom = atom(null, (_, set, token: string) => {
  // For demo, ignore token changes and always use hardcoded key
  console.log("Demo mode: ignoring token change, using hardcoded key");
  /*
  const trimmedToken = token.trim();
  if (trimmedToken === '') {
    localStorage.removeItem('tavus-token');
    set(apiTokenAtom, null);
  } else {
    localStorage.setItem('tavus-token', trimmedToken);
    set(apiTokenAtom, trimmedToken);
  }
  */
});

// Action atom to clear token
export const clearApiTokenAtom = atom(null, (_, set) => {
  // For demo, ignore clear requests
  console.log("Demo mode: ignoring token clear, keeping hardcoded key");
  /*
  localStorage.removeItem('tavus-token');
  set(apiTokenAtom, null);
  */
});
