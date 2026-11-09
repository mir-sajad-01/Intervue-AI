import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Interview = lazy(() => import('./pages/Interview'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Register = lazy(() => import('./pages/Register'));
const SessionResult = lazy(() => import('./pages/SessionResult'));

const App = () => (
  <div className="flex min-h-dvh flex-col text-slate-900 dark:text-slate-100">
    <Navbar />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)'
        },
        success: { iconTheme: { primary: 'var(--brand-primary)', secondary: 'var(--surface)' } },
        error: { iconTheme: { primary: 'var(--status-danger)', secondary: 'var(--surface)' } }
      }}
    />
    <div className="flex-1">
      <AppErrorBoundary>
        <Suspense fallback={<main className="page-shell mx-auto max-w-7xl px-4 sm:px-6"><Loader label="Loading page…" /></main>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/sessions/:id" element={<SessionResult />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </div>
    <footer className="border-t border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="font-semibold text-slate-700 dark:text-slate-300">IntervueAI</span>
        <span>Practice at your pace. Improve one answer at a time.</span>
      </div>
    </footer>
  </div>
);

export default App;
