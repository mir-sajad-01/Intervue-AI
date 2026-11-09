const PageHeader = ({ eyebrow, title, description, action, className = '' }) => (
  <div className={`mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div>
      {eyebrow ? <p className="section-kicker mb-2">{eyebrow}</p> : null}
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export default PageHeader;
