import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ShieldCheck, Video } from 'lucide-react';
import FormField from '../components/FormField';
import AppDialog from '../components/AppDialog';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import RequestError from '../components/RequestError';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryClient';
import { useProfile } from '../hooks/queries';
import api from '../utils/api';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { changePasswordSchema, getZodFieldErrors, profileSchema } from '../schemas/validation';

const Profile = () => {
  const { setUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isPending, error, refetch } = useProfile();
  const initializedRef = useRef(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!profile?.user || initializedRef.current) return;
    initializedRef.current = true;
    setForm({ name: profile.user.name, email: profile.user.email });
  }, [profile?.user]);

  const saveMutation = useMutation({
    mutationFn: async (values) => (await api.put('/auth/profile', values)).data,
    onSuccess: async ({ user }) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.profile, (current) => current ? { ...current, user } : current);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast.success('Profile updated');
    },
    onError: (saveError) => {
      const errors = getFieldErrors(saveError);
      if (saveError.response?.status === 409) errors.email = getErrorMessage(saveError, 'That email address is already in use.');
      setProfileErrors(errors);
      if (!Object.keys(errors).length) toast.error(getErrorMessage(saveError, 'Could not update profile'));
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (values) => api.put('/auth/password', values),
    onSuccess: async () => {
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      await logout();
      toast.success('Password changed. Please sign in again.');
      navigate('/login', { replace: true });
    },
    onError: (passwordError) => {
      const errors = getFieldErrors(passwordError);
      if (passwordError.response?.status === 400 && !Object.keys(errors).length) {
        errors.oldPassword = getErrorMessage(passwordError, 'Current password is incorrect.');
      }
      setPasswordErrors(errors);
      if (!Object.keys(errors).length) toast.error(getErrorMessage(passwordError, 'Could not change password'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/auth/account'),
    onSuccess: async () => {
      await logout();
      navigate('/', { replace: true });
    },
    onError: (deleteError) => toast.error(getErrorMessage(deleteError, 'Could not delete account'))
  });

  const save = (event) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setProfileErrors(getZodFieldErrors(parsed.error));
      return;
    }
    setProfileErrors({});
    saveMutation.mutate(parsed.data);
  };

  const changePassword = (event) => {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse(passwords);
    if (!parsed.success) {
      setPasswordErrors(getZodFieldErrors(parsed.error));
      return;
    }
    setPasswordErrors({});
    passwordMutation.mutate({ oldPassword: parsed.data.oldPassword, newPassword: parsed.data.newPassword });
  };

  const deleteAccount = () => setDeleteDialogOpen(true);

  if (isPending) return <main className="mx-auto max-w-4xl px-4 py-8"><Loader label="Loading profile..." /></main>;
  if (error || !profile) {
    return (
      <main className="page-shell mx-auto max-w-4xl px-4 sm:px-6">
        <RequestError title="Profile unavailable" message={getErrorMessage(error, 'Your profile could not be loaded.')} onRetry={() => refetch()} />
      </main>
    );
  }

  return (
    <main className="page-shell mx-auto max-w-5xl px-4 sm:px-6">
      <PageHeader eyebrow="Account" title="Profile settings" description="Keep your details up to date and manage how you sign in." />

      <section className="mb-7 grid gap-4 sm:grid-cols-3" aria-label="Account statistics">
        <div className="panel flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"><CalendarDays size={18} /></span><div><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Member since</p><p className="mt-1 font-semibold text-slate-950 dark:text-white">{new Date(profile.user.createdAt).toLocaleDateString()}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300"><Video size={18} /></span><div><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed sessions</p><p className="mt-1 font-semibold text-slate-950 dark:text-white">{profile.stats.totalSessions}</p></div></div>
        <div className="panel flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300"><ShieldCheck size={18} /></span><div><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average score</p><p className="mt-1 font-semibold text-slate-950 dark:text-white">{profile.stats.averageScore}%</p></div></div>
      </section>

      <form noValidate onSubmit={save} className="panel p-5 sm:p-7">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-semibold text-slate-950 dark:text-white">Personal information</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These details appear in your account and exported reports.</p></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField id="profile-name" label="Full name" type="text" autoComplete="name" value={form.name} error={profileErrors.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setProfileErrors((current) => ({ ...current, name: undefined })); }} />
          <FormField id="profile-email" label="Email address" type="email" autoComplete="email" value={form.email} error={profileErrors.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setProfileErrors((current) => ({ ...current, email: undefined })); }} />
        </div>
        <button className="btn-primary mt-5" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save changes'}</button>
      </form>

      <form noValidate onSubmit={changePassword} className="panel mt-5 p-5 sm:p-7">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-700"><h2 className="font-semibold text-slate-950 dark:text-white">Sign-in security</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Change your password to keep your account secure.</p></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FormField id="old-password" label="Current password" type="password" autoComplete="current-password" value={passwords.oldPassword} error={passwordErrors.oldPassword} onChange={(event) => { setPasswords((current) => ({ ...current, oldPassword: event.target.value })); setPasswordErrors((current) => ({ ...current, oldPassword: undefined })); }} />
          <FormField id="new-password" label="New password" type="password" autoComplete="new-password" hint="Use 8–72 characters with a letter and number." value={passwords.newPassword} error={passwordErrors.newPassword} onChange={(event) => { setPasswords((current) => ({ ...current, newPassword: event.target.value })); setPasswordErrors((current) => ({ ...current, newPassword: undefined })); }} />
          <FormField id="confirm-new-password" label="Confirm new password" type="password" autoComplete="new-password" value={passwords.confirmPassword} error={passwordErrors.confirmPassword} onChange={(event) => { setPasswords((current) => ({ ...current, confirmPassword: event.target.value })); setPasswordErrors((current) => ({ ...current, confirmPassword: undefined })); }} />
        </div>
        <button className="btn-secondary mt-5" type="submit" disabled={passwordMutation.isPending}>{passwordMutation.isPending ? 'Updating…' : 'Update password'}</button>
      </form>

      <section className="panel mt-5 flex flex-col gap-4 border-rose-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-rose-900/60">
        <div><h2 className="font-semibold text-slate-950 dark:text-white">Delete account</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Permanently remove your account and saved interview history.</p></div>
        <button className="btn-danger shrink-0" type="button" onClick={deleteAccount} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting…' : 'Delete account'}</button>
      </section>
      <AppDialog
        open={deleteDialogOpen}
        title="Delete your account?"
        description="This permanently deletes your account, saved interview sessions, and history. This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        busy={deleteMutation.isPending}
        actions={[
          { label: 'Keep account', variant: 'secondary', onSelect: () => setDeleteDialogOpen(false) },
          { label: 'Delete account', variant: 'danger', loadingLabel: 'Deleting…', onSelect: () => { setDeleteDialogOpen(false); deleteMutation.mutate(); } }
        ]}
      />
    </main>
  );
};

export default Profile;
