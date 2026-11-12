import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email wajib diisi';
    if (!form.password) errs.password = 'Password wajib diisi';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      const { user } = await api.login(form);
      signIn(user);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan percakapan tim Anda."
      footer={<>Belum punya akun? <Link to="/register" className="font-semibold text-brand hover:underline">Daftar</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={set('password')} />
        </Field>
        <button className="btn-primary w-full" disabled={sending}>{sending ? 'Memproses…' : 'Masuk'}</button>
      </form>
    </AuthShell>
  );
}
