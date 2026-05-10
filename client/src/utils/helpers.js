export const difficultySeconds = { Easy: 60, Medium: 90, Hard: 120 };
export const knownEmotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];

export const normalizeEmotion = (emotion) => {
  const normalized = String(emotion || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return knownEmotions.find((item) => normalized.includes(item)) || normalized;
};

export const emotionTone = (emotion) => {
  const cleanEmotion = normalizeEmotion(emotion);
  if (['happy', 'neutral'].includes(cleanEmotion)) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
  if (['fear', 'surprise'].includes(cleanEmotion)) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
  return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100';
};

export const gradeTone = (grade) =>
  ({
    A: 'text-[#4ECDC4]',
    B: 'text-[#6C63FF]',
    C: 'text-amber-400',
    D: 'text-orange-400',
    F: 'text-rose-400'
  })[grade] || 'text-slate-600';

export const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const emotionValue = (emotion) =>
  ({ angry: 1, disgust: 2, fear: 3, sad: 4, neutral: 5, surprise: 6, happy: 7 })[normalizeEmotion(emotion)] || 0;

export const aggregateTips = (answers = []) => [...new Set(answers.flatMap((answer) => answer.tips || []))];

export const describeTenPointScore = (value) => {
  const score = Math.max(0, Math.min(10, Number(value) || 0));
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Strong';
  if (score >= 5) return 'Fair';
  if (score >= 3) return 'Needs work';
  return 'Weak';
};

export const describePercentageScore = (value) => {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Needs work';
  return 'Needs focus';
};
