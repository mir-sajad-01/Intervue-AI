import { useCallback, useEffect, useRef, useState } from 'react';

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
  const transcriptRef = useRef('');
  const manualBaseRef = useRef('');
  const resultSegmentsRef = useRef(new Map());
  const ignoredResultsBeforeRef = useRef(0);
  const resultCountRef = useRef(0);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const updateTranscript = useCallback((value) => {
    transcriptRef.current = value;
    setTranscript(value);
  }, []);

  const editTranscript = useCallback((value) => {
    const nextValue = String(value);
    manualBaseRef.current = nextValue;
    resultSegmentsRef.current.clear();
    ignoredResultsBeforeRef.current = resultCountRef.current;
    updateTranscript(nextValue);
  }, [updateTranscript]);

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
      resultCountRef.current = event.results.length;
      const firstChangedResult = Math.max(event.resultIndex || 0, ignoredResultsBeforeRef.current);
      for (let index = firstChangedResult; index < event.results.length; index += 1) {
        resultSegmentsRef.current.set(index, event.results[index][0].transcript.trim());
      }

      const recognizedText = [...resultSegmentsRef.current.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, text]) => text)
        .filter(Boolean)
        .join(' ');
      const transcriptParts = [manualBaseRef.current.trim(), recognizedText].filter(Boolean);
      updateTranscript(transcriptParts.join(' ').trim());
      setError('');
    };
    recognition.onerror = (event) => {
      setError(speechErrorMessage(event.error));
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // The browser may already have stopped recognition during unmount.
      }
    };
  }, [updateTranscript]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError('');
    manualBaseRef.current = transcriptRef.current;
    resultSegmentsRef.current.clear();
    ignoredResultsBeforeRef.current = 0;
    resultCountRef.current = 0;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (error) {
      setListening(false);
      setError(speechErrorMessage(error?.name));
    }
  }, [supported]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore invalid-state errors when recognition has already stopped.
    }
    setListening(false);
  }, []);

  return { supported, listening, transcript, error, start, stop, setTranscript: editTranscript };
};
