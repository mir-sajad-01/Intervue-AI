const QuestionCard = ({ question, index, total }) => (
  <div className="panel p-5">
    <div className="mb-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
      Question {index + 1} of {total}
    </div>
    <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{question?.text}</h2>
    <div className="mt-3 text-sm text-slate-500">
      {question?.category} · {question?.difficulty}
    </div>
  </div>
);

export default QuestionCard;
