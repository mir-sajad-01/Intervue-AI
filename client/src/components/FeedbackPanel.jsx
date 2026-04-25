const FeedbackPanel = ({ feedback }) => {
  if (!feedback) return null;
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Latest Feedback</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        {['relevanceScore', 'fluencyScore', 'clarityScore'].map((key) => (
          <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-lg font-bold text-[#5B54E8] dark:text-[#4ECDC4]">{feedback[key]}</div>
            <div className="text-xs capitalize text-slate-400">{key.replace('Score', '')}</div>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {feedback.tips?.map((tip) => <li key={tip}>• {tip}</li>)}
      </ul>
    </div>
  );
};

export default FeedbackPanel;
