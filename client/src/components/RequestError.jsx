import { AlertCircle, RotateCcw } from 'lucide-react';

const RequestError = ({ title = 'We could not load this page', message, onRetry, retrying = false }) => (
  <section role="alert" className="panel flex flex-col gap-4 border-rose-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-rose-900/60">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"><AlertCircle size={19} /></span>
      <div>
        <h2 className="font-semibold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
    {onRetry ? <button className="btn-secondary self-start sm:self-auto" type="button" onClick={onRetry} disabled={retrying}><RotateCcw size={15} />{retrying ? 'Retrying…' : 'Try again'}</button> : null}
  </section>
);

export default RequestError;
