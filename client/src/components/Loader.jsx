const Loader = ({ label = 'Loading...' }) => (
  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" aria-hidden="true" />
    {label}
  </div>
);

export default Loader;
