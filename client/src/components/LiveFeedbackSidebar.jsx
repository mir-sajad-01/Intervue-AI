import { emotionTone, normalizeEmotion } from '../utils/helpers';

const fillerWords = ['umm', 'um', 'uh', 'like', 'you know', 'basically', 'actually'];

const countFillers = (text = '') => {
  const normalized = text.toLowerCase();
  return fillerWords.reduce((total, filler) => {
    const pattern = new RegExp(`\\b${filler.replace(' ', '\\s+')}\\b`, 'g');
    return total + (normalized.match(pattern)?.length || 0);
  }, 0);
};

const positiveConfidence = (emotion) => {
  const confidences = emotion?.allEmotions || [];
  const positive = confidences.filter((item) => ['happy', 'neutral'].includes(normalizeEmotion(item.label)));
  if (positive.length) return Math.max(...positive.map((item) => Number(item.confidence) || 0));
  return ['happy', 'neutral'].includes(normalizeEmotion(emotion?.emotion)) ? Number(emotion?.confidence) || 0 : 0;
};

const paceLabel = (transcript, elapsedSeconds) => {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (!words || elapsedSeconds < 3) return { label: 'Waiting', tone: 'text-slate-400' };

  const wpm = Math.round(words / (elapsedSeconds / 60));
  if (wpm < 100) return { label: `Too Slow - ${wpm} wpm`, tone: 'text-amber-400' };
  if (wpm > 160) return { label: `Too Fast - ${wpm} wpm`, tone: 'text-rose-400' };
  return { label: `Good Pace - ${wpm} wpm`, tone: 'text-emerald-400' };
};

const LiveFeedbackSidebar = ({ emotion, transcript, elapsedSeconds, warming }) => {
  const confidence = positiveConfidence(emotion);
  const pace = paceLabel(transcript || '', elapsedSeconds);
  const cleanEmotion = normalizeEmotion(emotion?.emotion);

  return (
    <aside className="panel p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Live Feedback</div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Emotion</div>
          {warming ? (
            <span className="text-xs text-[#6C63FF] dark:text-[#4ECDC4]">Warming up</span>
          ) : cleanEmotion ? (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${emotionTone(cleanEmotion)}`}>
              {cleanEmotion}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Waiting</span>
          )}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Positive confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#4ECDC4] transition-all duration-500"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Fillers: {countFillers(transcript)}</div>
        <div className={`text-xs font-semibold ${pace.tone}`}>{pace.label}</div>
      </div>
    </aside>
  );
};

export default LiveFeedbackSidebar;
