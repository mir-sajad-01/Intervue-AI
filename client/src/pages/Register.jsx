import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import FormField from '../components/FormField';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { getZodFieldErrors, registerSchema } from '../schemas/validation';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    try {
      await register({ name: parsed.data.name, email: parsed.data.email, password: parsed.data.password });
      navigate('/dashboard');
    } catch (error) {
      const errors = getFieldErrors(error);
      setFieldErrors(errors);
      if (!Object.keys(errors).length) toast.error(getErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <AuthLayout eyebrow="Get started" title="Create your account" description="Save your sessions and keep your progress in one place.">
      <form noValidate onSubmit={submit} className="mt-7">
        <div className="space-y-4">
          <FormField id="name" label="Full name" type="text" name="name" autoComplete="name" value={form.name} error={fieldErrors.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setFieldErrors((current) => ({ ...current, name: undefined })); }} />
          <FormField id="email" label="Email address" type="email" name="email" autoComplete="email" value={form.email} error={fieldErrors.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setFieldErrors((current) => ({ ...current, email: undefined })); }} />
          <FormField id="password" label="Password" type="password" name="password" autoComplete="new-password" hint="Use 8–72 characters with at least one letter and number." value={form.password} error={fieldErrors.password} onChange={(event) => { setForm((current) => ({ ...current, password: event.target.value })); setFieldErrors((current) => ({ ...current, password: undefined })); }} />
          <FormField id="confirmPassword" label="Confirm password" type="password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} error={fieldErrors.confirmPassword} onChange={(event) => { setForm((current) => ({ ...current, confirmPassword: event.target.value })); setFieldErrors((current) => ({ ...current, confirmPassword: undefined })); }} />
        </div>
        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>{loading ? <Loader label="Creating account…" /> : 'Create account'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">Already have an account? <Link className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300" to="/login">Log in</Link></p>
    </AuthLayout>
  );
};

export default Register;
