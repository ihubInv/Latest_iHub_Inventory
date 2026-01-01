import { useState, useEffect } from 'react';

// Custom hook to persist state in localStorage
export function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

// Hook specifically for form state persistence
export function usePersistedFormState<T extends Record<string, any>>(
  formName: string,
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const storageKey = `form_${formName}`;
  const [formState, setFormState] = usePersistedState<T>(storageKey, initialState);

  const clearFormState = () => {
    setFormState(initialState);
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing form state for ${formName}:`, error);
    }
  };

  return [formState, setFormState, clearFormState];
}

// Hook for simple boolean flags
export function usePersistedBoolean(key: string, defaultValue: boolean = false): [boolean, (value: boolean) => void] {
  const [value, setValue] = usePersistedState<boolean>(key, defaultValue);
  return [value, setValue];
}

// Hook for arrays
export function usePersistedArray<T>(key: string, defaultValue: T[] = []): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  return usePersistedState<T[]>(key, defaultValue);
}
