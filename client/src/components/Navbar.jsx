import { ArrowRight, LayoutDashboard, LogOut, Menu, MessageSquareText, Moon, Plus, Sun, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // Theme preference remains available for the current page view.
    }
  }, [dark]);

  useEffect(() => setMenuOpen(false), [user]);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log out. Please try again.'));
    }
  };

  const links = user ? (
    <>
      <NavLink to="/dashboard" className="nav-link" onClick={closeMenu}><LayoutDashboard size={16} />Overview</NavLink>
      <NavLink to="/interview" className="nav-link" onClick={closeMenu}><Plus size={16} />Practice</NavLink>
      <NavLink to="/history" className="nav-link" onClick={closeMenu}>History</NavLink>
      <NavLink to="/profile" className="nav-link" onClick={closeMenu}><UserRound size={16} />Profile</NavLink>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} onClick={closeMenu} className="flex shrink-0 items-center gap-2.5" aria-label="Intervue home">
          <span className="brand-mark"><MessageSquareText size={19} strokeWidth={2.3} /></span>
          <span className="text-[1.05rem] font-bold tracking-tight text-slate-950 dark:text-white">Intervue<span className="text-emerald-700 dark:text-emerald-400">AI</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">{links}</nav>

        <div className="flex items-center gap-2">
          {user ? <span className="hidden max-w-36 truncate text-sm font-medium text-slate-600 lg:block">{user.name}</span> : null}
          <button
            className="btn-secondary h-10 w-10 min-h-10 px-0"
            type="button"
            aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user ? (
            <button className="btn-secondary hidden h-10 min-h-10 w-10 px-0 md:inline-flex" type="button" aria-label="Log out" onClick={handleLogout}>
              <LogOut size={17} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-secondary hidden min-h-10 sm:inline-flex">Log in</Link>
              <Link to="/register" className="btn-primary hidden min-h-10 sm:inline-flex">Get started <ArrowRight size={15} /></Link>
            </>
          )}
          <button
            className="btn-secondary h-10 w-10 min-h-10 px-0 md:hidden"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-navigation" className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden" aria-label="Mobile navigation">
          {user ? <>{links}<button className="nav-link mt-1 w-full justify-start" type="button" onClick={handleLogout}><LogOut size={16} />Log out</button></> : (
            <>
              <Link className="nav-link" to="/login" onClick={closeMenu}>Log in</Link>
              <Link className="btn-primary mt-1" to="/register" onClick={closeMenu}>Get started <ArrowRight size={15} /></Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
};

export default Navbar;
