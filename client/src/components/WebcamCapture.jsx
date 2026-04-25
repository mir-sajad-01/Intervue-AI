import { Camera } from 'lucide-react';
import { useEffect } from 'react';

const WebcamCapture = ({ webcam }) => {
  useEffect(() => {
    webcam.start();
  }, []);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Webcam</span>
        <Camera size={18} className="text-[#4ECDC4]" />
      </div>
      {webcam.error ? (
        <div className="p-6 text-sm text-rose-600 dark:text-rose-300">{webcam.error}</div>
      ) : (
        <video ref={webcam.videoRef} autoPlay playsInline muted className="aspect-video w-full bg-slate-950 object-cover" />
      )}
    </div>
  );
};

export default WebcamCapture;
