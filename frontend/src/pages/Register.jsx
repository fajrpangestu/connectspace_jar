import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nama lengkap wajib diisi';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Format email tidak valid';
    if (!form.password) e.password = 'Password wajib diisi';
    else if (form.password.length < 6) e.password = 'Password minimal 6 karakter';
    if (!form.confirm_password) e.confirm_password = 'Konfirmasi password wajib diisi';
    else if (form.password !== form.confirm_password) e.confirm_password = 'Konfirmasi password tidak cocok';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await api.register(form);
      navigate('/login', { replace: true }); // tidak auto-login: lanjut ke form login
      notify('Registrasi berhasil! Silakan login dengan akun Anda.', 'success');
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <AuthShell
      title="Buat akun"
      subtitle="Daftar, lalu masuk dengan akun baru Anda."
      footer={<>Sudah punya akun? <Link to="/login" className="font-semibold text-brand hover:underline">Masuk</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nama lengkap" error={errors.name}>
          <input autoComplete="name" className={cls('name')} value={form.name} onChange={set('name')} maxLength={100} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className={cls('email')} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password" error={errors.password} hint="Minimal 6 karakter">
          <input type="password" autoComplete="new-password" className={cls('password')} value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Konfirmasi password" error={errors.confirm_password}>
          <input type="password" autoComplete="new-password" className={cls('confirm_password')} value={form.confirm_password} onChange={set('confirm_password')} />
        </Field>
        <button className="btn-primary w-full" disabled={sending}>{sending ? 'Mendaftarkan…' : 'Daftar'}</button>
      </form>
    </AuthShell>
  );
}
