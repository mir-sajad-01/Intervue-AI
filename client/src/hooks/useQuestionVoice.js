import { useCallback, useEffect, useState } from 'react';

export const useQuestionVoice = () => {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(() => localStorage.getItem('questionVoice') !== 'off');

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  }, []);

  useEffect(() => {
    localStorage.setItem('questionVoice', enabled ? 'on' : 'off');
  }, [enabled]);

  const speak = useCallback(
    (text) => {
      if (!supported || !enabled || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [enabled, supported]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  useEffect(() => () => stop(), [stop]);

  return { supported, enabled, setEnabled, speak, stop };
};
