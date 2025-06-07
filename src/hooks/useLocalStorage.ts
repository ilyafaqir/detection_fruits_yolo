import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State pour stocker notre valeur
  // Passer la fonction d'initialisation à useState pour que la logique ne s'exécute qu'une fois
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Retourner une version wrappée de la fonction useState's setter qui persiste
  // la nouvelle valeur dans localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à la valeur d'être une fonction pour que nous ayons la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage; 