import { useEffect, useRef, useState } from 'react';

export const useWebcam = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestIdRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    try {
      setError('');
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setReady(true);
    } catch (err) {
      const messages = {
        NotAllowedError: 'Camera permission denied. Allow webcam access to analyze expressions.',
        NotFoundError: 'No camera was found on this device.',
        NotReadableError: 'Camera is in use by another application.'
      };
      setError(messages[err.name] || 'Unable to start webcam.');
      setReady(false);
    }
  };

  const stop = () => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  };

  const capture = () => {
    if (!videoRef.current || !ready) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  useEffect(() => () => stop(), []);

  return { videoRef, ready, error, start, stop, capture };
};
