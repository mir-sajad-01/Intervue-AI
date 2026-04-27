import { useEffect, useRef, useState } from 'react';

const speechErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'network':
      return 'Speech recognition is temporarily unavailable. You can still type your answer manually.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Please allow microphone access and try again.';
    case 'audio-capture':
      return 'No working microphone was detected. Check your microphone and try again.';
    case 'no-speech':
      return 'No speech was detected. Try speaking a little louder or closer to the microphone.';
    case 'aborted':
      return 'Speech recognition was stopped before it finished.';
    case 'language-not-supported':
      return 'This browser does not support speech recognition for the selected language.';
    default:
      return 'Speech recognition could not start right now. You can still type your answer manually.';
  }
};

export const useSpeech = () => {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      setTranscript(text);
      setError('');
    };
    recognition.onerror = (event) => {
      setError(speechErrorMessage(event.error));
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const start = () => {
    if (!supported || !recognitionRef.current) return;
    setError('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (error) {
      setListening(false);
      setError(speechErrorMessage(error?.name));
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { supported, listening, transcript, error, start, stop, setTranscript };
};
