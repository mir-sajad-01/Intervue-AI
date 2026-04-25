import { Mic, Square } from 'lucide-react';

const SpeechRecorder = ({ speech }) => {
  if (!speech.supported) {
    return <div className="panel p-4 text-sm text-amber-700 dark:text-amber-300">This browser does not support the Web Speech API.</div>;
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Answer Transcript</h3>
        <button className={speech.listening ? 'btn-secondary' : 'btn-primary'} onClick={speech.listening ? speech.stop : speech.start}>
          {speech.listening ? <Square size={16} /> : <Mic size={16} />}
          {speech.listening ? 'Stop' : 'Start Answering'}
        </button>
      </div>
      {speech.error && <p className="mb-2 text-sm text-rose-600">{speech.error}</p>}
      <textarea
        className="input min-h-32"
        value={speech.transcript}
        onChange={(event) => speech.setTranscript(event.target.value)}
        placeholder="Your spoken answer appears here."
      />
    </div>
  );
};

export default SpeechRecorder;
