import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile().then((data) => {
      setProfile(data);
      setForm({ name: data.user.name, email: data.user.email });
    }).finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    const { data } = await api.put('/auth/profile', form);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast.success('Profile updated');
    await refreshProfile();
  };

  const changePassword = async (event) => {
    event.preventDefault();
    await api.put('/auth/password', passwords);
    setPasswords({ oldPassword: '', newPassword: '' });
    toast.success('Password changed');
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account and all sessions? This cannot be undone.')) return;
    await api.delete('/auth/account');
    await logout();
    navigate('/');
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-8"><Loader label="Loading profile..." /></main>;

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
      <h1 className="text-3xl font-black text-slate-950 dark:text-white">Profile</h1>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4"><div className="text-sm text-slate-500">Member Since</div><div className="font-bold">{new Date(profile.user.createdAt).toLocaleDateString()}</div></div>
        <div className="panel p-4"><div className="text-sm text-slate-500">Total Sessions</div><div className="font-bold">{profile.stats.totalSessions}</div></div>
        <div className="panel p-4"><div className="text-sm text-slate-500">Average Score</div><div className="font-bold">{profile.stats.averageScore}%</div></div>
      </section>
      <form onSubmit={save} className="panel p-5">
        <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Account Details</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <button className="btn-primary mt-4">Save</button>
      </form>
      <form onSubmit={changePassword} className="panel p-5">
        <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Change Password</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" type="password" placeholder="Old password" value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} />
          <input className="input" type="password" placeholder="New password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
        </div>
        <button className="btn-primary mt-4">Change Password</button>
      </form>
      <section className="panel p-5">
        <h2 className="mb-2 font-bold text-rose-600">Delete Account</h2>
        <button className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" onClick={deleteAccount}>Delete Account</button>
      </section>
    </main>
  );
};

export default Profile;
