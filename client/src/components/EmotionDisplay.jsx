import { emotionTone } from '../utils/helpers';

const EmotionDisplay = ({ emotion, confidence, warming }) => (
  <div className="panel p-4">
    <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Live Emotion</div>
    {warming ? (
      <p className="text-sm text-cyan-700 dark:text-cyan-300">Warming up AI model...</p>
    ) : emotion ? (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold capitalize ${emotionTone(emotion)}`}>
        {emotion} · {Math.round((confidence || 0) * 100)}%
      </span>
    ) : (
      <p className="text-sm text-slate-500">Waiting for first frame.</p>
    )}
  </div>
);

export default EmotionDisplay;
