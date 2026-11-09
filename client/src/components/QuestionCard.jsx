const QuestionCard = ({ question, index, total }) => (
  <section className="panel p-5 sm:p-7" aria-labelledby="current-question">
    <div className="mb-5 flex items-center justify-between gap-4">
      <p className="section-kicker">Question {index + 1} of {total}</p>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{Math.round(((index + 1) / Math.max(total, 1)) * 100)}% complete</span>
    </div>
    <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${Math.round(((index + 1) / Math.max(total, 1)) * 100)}%` }} /></div>
    <h2 id="current-question" className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-[1.8rem]">{question?.text}</h2>
    <div className="mt-5 flex flex-wrap gap-2">
      {question?.category ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{question.category}</span> : null}
      {question?.difficulty ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{question.difficulty}</span> : null}
    </div>
  </section>
);

export default QuestionCard;
