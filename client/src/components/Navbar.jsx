import { Moon, Sun, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const navClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition duration-300 ${isActive ? 'bg-[#6C63FF]/10 text-[#5B54E8] shadow-[0_0_24px_rgba(108,99,255,0.16)] dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-[#6C63FF]/10 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'}`;

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/75 shadow-[0_12px_40px_rgba(76,79,124,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0F0F1A]/80 dark:shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to={user ? '/dashboard' : '/'} className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
          Intervue<span className="bg-gradient-to-r from-[#6C63FF] to-[#4ECDC4] bg-clip-text text-transparent">AI</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user && (
            <>
              <NavLink to="/dashboard" className={navClass}><LayoutDashboard size={16} /> </NavLink>
              <NavLink to="/history" className={navClass}>History</NavLink>
              <NavLink to="/profile" className={navClass}><User size={16} /></NavLink>
            </>
          )}
          <button className="btn-secondary px-3" title="Toggle dark mode" onClick={() => setDark((value) => !value)}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <button
              className="btn-secondary px-3"
              title="Log out"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Link to="/login" className="btn-primary">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
