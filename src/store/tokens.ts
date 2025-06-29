import { atom } from "jotai";

// Get initial token from localStorage
const getInitialToken = (): string | null => {
  try {
    const savedToken = localStorage.getItem('tavus-token');
    return savedToken && savedToken.trim() !== '' ? savedToken.trim() : null;
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
};

// Atom to store the API token
export const apiTokenAtom = atom<string | null>(getInitialToken());

// Atom to track if token is being validated
export const isValidatingTokenAtom = atom(false);

// Derived atom to check if token exists
export const hasTokenAtom = atom((get) => get(apiTokenAtom) !== null);

// Action atom to set token
export const setApiTokenAtom = atom(null, (_, set, token: string) => {
  const trimmedToken = token.trim();
  if (trimmedToken === '') {
    localStorage.removeItem('tavus-token');
    set(apiTokenAtom, null);
  } else {
    localStorage.setItem('tavus-token', trimmedToken);
    set(apiTokenAtom, trimmedToken);
  }
});

// Action atom to clear token
export const clearApiTokenAtom = atom(null, (_, set) => {
  localStorage.removeItem('tavus-token');
  set(apiTokenAtom, null);
});
