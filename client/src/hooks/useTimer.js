import { useEffect, useState } from 'react';

export const useTimer = (initialSeconds = 60, active = false, onComplete) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => setSeconds(initialSeconds), [initialSeconds]);

  useEffect(() => {
    if (!active) return undefined;
    if (seconds <= 0) {
      onComplete?.();
      return undefined;
    }
    const id = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [active, seconds, onComplete]);

  return { seconds, reset: () => setSeconds(initialSeconds), setSeconds };
};
