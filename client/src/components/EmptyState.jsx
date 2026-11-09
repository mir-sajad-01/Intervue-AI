import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <section className="panel flex flex-col items-center px-5 py-12 text-center sm:py-16">
    {Icon ? <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon size={21} /></span> : null}
    <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
    {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </section>
);

export const EmptyStateLink = ({ to, children }) => (
  <Link to={to} className="btn-primary">{children}<ArrowRight size={15} /></Link>
);

export default EmptyState;
