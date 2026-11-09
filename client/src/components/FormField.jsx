const FormField = ({ label, id, error, hint, className = '', ...inputProps }) => (
  <label className={`block ${className}`} htmlFor={id}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <input
      id={id}
      className="input"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...inputProps}
    />
    {error ? <span id={`${id}-error`} role="alert" className="mt-1.5 block text-xs text-rose-600 dark:text-rose-400">{error}</span> : null}
    {!error && hint ? <span id={`${id}-hint`} className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
  </label>
);

export default FormField;
