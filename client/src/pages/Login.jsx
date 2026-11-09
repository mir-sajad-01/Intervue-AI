import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import FormField from '../components/FormField';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { getZodFieldErrors, loginSchema } from '../schemas/validation';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    try {
      await login(parsed.data);
      navigate('/dashboard');
    } catch (error) {
      const errors = getFieldErrors(error);
      setFieldErrors(errors);
      if (!Object.keys(errors).length) toast.error(getErrorMessage(error, 'Login failed. Please try again.'));
    }
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in to your account" description="Pick up where your practice left off.">
      <form noValidate onSubmit={submit} className="mt-7">
        <div className="space-y-4">
          <FormField id="email" label="Email address" type="email" name="email" autoComplete="email" value={form.email} error={fieldErrors.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setFieldErrors((current) => ({ ...current, email: undefined })); }} />
          <FormField id="password" label="Password" type="password" name="password" autoComplete="current-password" value={form.password} error={fieldErrors.password} onChange={(event) => { setForm((current) => ({ ...current, password: event.target.value })); setFieldErrors((current) => ({ ...current, password: undefined })); }} />
        </div>
        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>{loading ? <Loader label="Signing in…" /> : 'Log in'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">New here? <Link className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300" to="/register">Create an account</Link></p>
    </AuthLayout>
  );
};

export default Login;
