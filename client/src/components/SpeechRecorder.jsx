import { Mic, Square } from 'lucide-react';

const SpeechRecorder = ({ speech, validationError = '' }) => {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Answer Transcript</h3>
        {speech.supported ? (
          <button className={speech.listening ? 'btn-secondary' : 'btn-primary'} type="button" aria-pressed={speech.listening} onClick={speech.listening ? speech.stop : speech.start}>
            {speech.listening ? <Square size={16} /> : <Mic size={16} />}
            {speech.listening ? 'Stop recording' : 'Start speaking'}
          </button>
        ) : null}
      </div>
      {!speech.supported ? <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">Speech recognition is not available in this browser. You can still type your answer below.</p> : null}
      {speech.listening ? <p className="mb-3 text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite">Listening now. You can edit the transcript while you speak.</p> : null}
      {(validationError || speech.error) && (
        <div id={validationError ? 'answer-transcript-error' : undefined} role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {validationError || speech.error}
        </div>
      )}
      <textarea
        className="input min-h-32"
        value={speech.transcript}
        onChange={(event) => speech.setTranscript(event.target.value)}
        aria-label="Your spoken answer"
        aria-invalid={Boolean(validationError)}
        aria-describedby={validationError ? 'answer-transcript-error' : undefined}
        placeholder="Your spoken answer appears here."
      />
      <p className="mt-2 text-right text-xs text-slate-500 dark:text-slate-400">{speech.transcript.length.toLocaleString()} / 12,000</p>
    </div>
  );
};

export default SpeechRecorder;
