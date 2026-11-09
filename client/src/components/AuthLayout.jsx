import { ArrowUpRight, Check, ShieldCheck } from 'lucide-react';

const AuthLayout = ({ eyebrow, title, description, children }) => (
  <main className="page-shell mx-auto flex w-full max-w-6xl items-center px-4 sm:px-6">
    <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="auth-aside relative hidden min-h-[38rem] flex-col justify-between overflow-hidden p-9 text-white lg:flex xl:p-12">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"><ShieldCheck size={14} />Your practice space</span>
          <h2 className="mt-10 max-w-sm text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">Good answers come from thoughtful practice.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Build confidence one question at a time, then use clear feedback to decide what to work on next.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {['Timed interview sessions', 'Editable live transcription', 'Saved scores and coaching notes'].map((item) => <li className="flex items-center gap-2.5" key={item}><Check size={15} className="text-emerald-300" />{item}</li>)}
          </ul>
        </div>
        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">A better way to prepare</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">Review your progress over time and keep your next step in view.</p>
          <ArrowUpRight className="absolute right-5 top-5 text-emerald-200" size={18} />
        </div>
      </aside>
      <section className="flex items-center justify-center p-5 sm:p-9 lg:p-10">
        <div className="w-full max-w-md">
          <p className="section-kicker">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
          {children}
        </div>
      </section>
    </div>
  </main>
);

export default AuthLayout;
