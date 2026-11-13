import { useState } from 'react';
import { api, toFormData } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import ImagePicker from './ImagePicker.jsx';

export default function PostForm({ onCreated }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [content, setContent] = useState('');
  const [img, setImg] = useState({ file: null, url: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !img.file && !img.url.trim()) {
      return notify('Status tidak boleh kosong: isi teks atau lampirkan gambar.', 'warning');
    }
    setSending(true);
    try {
      const { post } = await api.createPost(toFormData({ content, image: img.file, image_url: img.url }));
      onCreated(post);
      setContent('');
      setImg({ file: null, url: '' });
      notify('Status diunggah.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <div className="flex gap-3">
        <Avatar user={user} size={44} />
        <textarea
          className="input min-h-[88px] resize-y"
          placeholder={`Apa kabar, ${user.name.split(' ')[0]}?`}
          value={content}
          maxLength={5000}
          onChange={(e) => setContent(e.target.value)}
          aria-label="Isi status"
        />
      </div>
      <div className="pl-[56px]">
        <ImagePicker value={img} onChange={setImg} onError={(m) => notify(m, 'error')} label="Gambar" />
      </div>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={sending}>{sending ? 'Menerbitkan…' : 'Unggah'}</button>
      </div>
    </form>
  );
}
