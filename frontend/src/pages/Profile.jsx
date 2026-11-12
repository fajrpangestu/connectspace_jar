import { useState } from 'react';
import { api, toFormData } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Field from '../components/Field.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [img, setImg] = useState({ file: null, url: '' });
  const [remove, setRemove] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErrors({ name: 'Nama pengguna wajib diisi' });
    setErrors({});
    setSending(true);
    try {
      const { user: updated } = await api.updateProfile(
        toFormData({ name, bio, avatar: img.file, avatar_url: img.url, remove_avatar: remove ? 'true' : '' })
      );
      setUser(updated);
      setImg({ file: null, url: '' });
      setRemove(false);
      notify('Profil berhasil diperbarui.', 'success');
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6" noValidate>
      <h2 className="text-lg font-extrabold">Profil</h2>
      <div className="flex items-start gap-4">
        <Avatar key={user.avatar || 'none'} user={remove ? { name: user.name } : user} size={72} />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Foto profil</p>
          <ImagePicker value={img} onChange={(v) => { setImg(v); setRemove(false); }} onError={(m) => notify(m, 'error')} label="Foto" />
          {user.avatar && !img.file && !img.url && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={remove} onChange={(e) => setRemove(e.target.checked)} /> Hapus foto profil saat ini
            </label>
          )}
          {errors.avatar && <p className="text-xs font-medium text-heart" role="alert">{errors.avatar}</p>}
        </div>
      </div>
      <Field label="Nama pengguna" error={errors.name}>
        <input className={`input ${errors.name ? 'input-error' : ''}`} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Bio" error={errors.bio} hint={`${bio.length}/500`}>
        <textarea className="input min-h-[96px] resize-y" value={bio} maxLength={500} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={sending}>{sending ? 'Menyimpan…' : 'Simpan perubahan'}</button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { notify } = useToast();
  const empty = { old_password: '', new_password: '', confirm_new_password: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.old_password) errs.old_password = 'Password lama wajib diisi';
    if (!form.new_password) errs.new_password = 'Password baru wajib diisi';
    else if (form.new_password.length < 6) errs.new_password = 'Password baru minimal 6 karakter';
    if (!form.confirm_new_password) errs.confirm_new_password = 'Konfirmasi password baru wajib diisi';
    else if (form.new_password !== form.confirm_new_password) errs.confirm_new_password = 'Konfirmasi password tidak cocok';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await api.changePassword(form);
      setForm(empty);
      notify('Password berhasil diubah.', 'success');
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-lg font-extrabold">Ubah password</h2>
      <Field label="Password lama" error={errors.old_password}>
        <input type="password" autoComplete="current-password" className={cls('old_password')} value={form.old_password} onChange={set('old_password')} />
      </Field>
      <Field label="Password baru" error={errors.new_password} hint="Minimal 6 karakter">
        <input type="password" autoComplete="new-password" className={cls('new_password')} value={form.new_password} onChange={set('new_password')} />
      </Field>
      <Field label="Konfirmasi password baru" error={errors.confirm_new_password}>
        <input type="password" autoComplete="new-password" className={cls('confirm_new_password')} value={form.confirm_new_password} onChange={set('confirm_new_password')} />
      </Field>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={sending}>{sending ? 'Menyimpan…' : 'Ubah password'}</button>
      </div>
    </form>
  );
}

export default function Profile() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <ProfileForm />
      <PasswordForm />
    </main>
  );
}
