import { ArrowRight, BarChart3, Check, Mic2, Timer, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { Icon: Mic2, number: '01', title: 'Answer in your own words', text: 'Work through focused questions at a pace that gives you room to think and speak clearly.' },
  { Icon: Video, number: '02', title: 'Notice how you come across', text: 'Use live transcription and optional camera feedback to review more than the words alone.' },
  { Icon: BarChart3, number: '03', title: 'Build a record of progress', text: 'Keep completed sessions together and see how your answers change over time.' }
];

const Landing = () => {
  const { user } = useAuth();
  const destination = user ? '/interview' : '/register';

  return (
    <main>
      <section className="hero-surface">
        <div className="hero-grid mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="section-kicker">Interview practice, with a plan</p>
            <h1 className="mt-5 text-[2.65rem] font-bold leading-[1.08] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl lg:text-[3.7rem]">
              Feel prepared for the questions that matter.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Practice speaking through real interview scenarios, review useful feedback, and come back with a stronger answer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to={destination} className="btn-primary min-h-12 px-5">
                {user ? 'Start a practice session' : 'Create your account'} <ArrowRight size={17} />
              </Link>
              {!user ? <Link to="/login" className="btn-secondary min-h-12 px-5">Log in to your account</Link> : null}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-emerald-700 dark:text-emerald-400" />Choose the interview type</span>
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-emerald-700 dark:text-emerald-400" />Speak or type your answer</span>
            </div>
          </div>

          <div className="hero-preview mx-auto w-full max-w-xl p-5 sm:p-7" aria-label="Interview session preview">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-5 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="brand-mark"><Mic2 size={18} /></span>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Practice session</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Behavioural / Medium</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Timer size={14} /> Timed
              </span>
            </div>

            <div className="py-6">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Question 2 of 5</span><span>01:24 remaining</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-2/5 rounded-full bg-emerald-600" />
              </div>
              <p className="mt-6 text-xl font-semibold leading-8 tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Tell me about a time you had to adapt to a difficult situation.
              </p>
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-300/15 dark:bg-emerald-400/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Mic2 size={14} />Answer transcript</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">“I started by identifying what had changed, then aligned with the team on the next step…”</p>
                <p className="mt-2 text-right text-[11px] text-slate-400">Editable while you speak</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              {[
                ['Relevance', '8 / 10'],
                ['Clarity', '7 / 10'],
                ['Fluency', '8 / 10']
              ].map(([label, score]) => (
                <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70" key={label}>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="section-kicker">A useful practice loop</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Turn practice into progress.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">Prepare for a specific role or work through a broad interview. Each session gives you a clear place to start and a way to review what happened.</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {features.map(({ Icon, number, title, text }) => (
            <article className="panel h-full p-6 sm:p-7" key={number}>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon size={20} /></span>
                <span className="text-sm font-semibold tabular-nums text-slate-400">{number}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-slate-950 px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10 sm:py-10 dark:bg-slate-900">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-300">A little practice goes a long way</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start with one question. Build from there.</h2>
          </div>
          <Link to={destination} className="btn-primary shrink-0 bg-emerald-600">Start practicing <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
};

export default Landing;
