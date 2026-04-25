import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <main className="mx-auto grid min-h-[80vh] max-w-md content-center px-4">
      <form onSubmit={submit} className="panel p-6">
        <h1 className="mb-6 text-3xl font-black text-slate-950 dark:text-white">Login</h1>
        <input className="input mb-3" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input mb-4" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn-primary w-full" disabled={loading}>{loading ? <Loader label="Signing in..." /> : 'Login'}</button>
        <p className="mt-4 text-sm text-slate-500">New here? <Link className="font-semibold text-cyan-600" to="/register">Create account</Link></p>
      </form>
    </main>
  );
};

export default Login;
