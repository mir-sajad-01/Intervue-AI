import { ArrowRight, BarChart3, BrainCircuit, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  return (
    <main>
      <section className="relative overflow-hidden bg-[#0F0F1A] text-white">
        <div className="absolute inset-0 opacity-35">
          <img
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(108,99,255,0.34),transparent_28rem),radial-gradient(circle_at_84%_12%,rgba(78,205,196,0.24),transparent_24rem),linear-gradient(90deg,rgba(15,15,26,0.98),rgba(15,15,26,0.66),rgba(15,15,26,0.9))]" />
        <div className="relative mx-auto grid min-h-[76vh] max-w-7xl content-center px-4 py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 shadow-[0_0_30px_rgba(108,99,255,0.12)] backdrop-blur-xl">
              AI interview practice with real-time coaching
            </div>
            <h1 className="gradient-text text-5xl font-black tracking-tight sm:text-7xl">IntervueAI</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Practice interviews with live facial expression analysis, speech transcription, answer scoring, and progress tracking.
            </p>
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary mt-8">
              Start Practicing <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          [Video, 'Expression insight', 'Your deployed FER2013 MobileNetV2 model powers live emotion snapshots.'],
          [BrainCircuit, 'Answer coaching', 'Gemini evaluates relevance, fluency, clarity, tips, and better sample answers.'],
          [BarChart3, 'Progress analytics', 'Track score trends, emotion distribution, streaks, and session history.']
        ].map(([Icon, title, text]) => (
          <div className="panel p-5" key={title}>
            <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-[#6C63FF]/20 to-[#4ECDC4]/20 p-3 text-[#4ECDC4] ring-1 ring-white/10">
              <Icon />
            </div>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Landing;
