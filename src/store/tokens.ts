import { atom } from "jotai";

// PRODUCTION - Using your actual Tavus API key
const TAVUS_API_KEY = "57d74927dd6148f19c081364a7d1e024";

// Get initial token from localStorage
const getInitialToken = (): string | null => {
  try {
    // Use your actual Tavus API key
    return TAVUS_API_KEY;
    
    // Original localStorage logic (commented out for production)
    /*
    const savedToken = localStorage.getItem('tavus-token');
    return savedToken && savedToken.trim() !== '' ? savedToken.trim() : null;
    */
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return TAVUS_API_KEY;
  }
};

// Atom to store the API token
export const apiTokenAtom = atom<string | null>(TAVUS_API_KEY);

// Atom to track if token is being validated
export const isValidatingTokenAtom = atom(false);

// Derived atom to check if token exists
export const hasTokenAtom = atom((get) => true); // Always true for production

// Action atom to set token
export const setApiTokenAtom = atom(null, (_, set, token: string) => {
  // For production, ignore token changes and always use your API key
  console.log("Production mode: ignoring token change, using your API key");
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
  // For production, ignore clear requests
  console.log("Production mode: ignoring token clear, keeping your API key");
  /*
  localStorage.removeItem('tavus-token');
  set(apiTokenAtom, null);
  */
});
