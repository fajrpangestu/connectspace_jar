import { useEffect, useState } from 'react';
import { api, timeAgo, toFormData } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import EditBox from './EditBox.jsx';
import ImagePicker from './ImagePicker.jsx';
import { PencilIcon, TrashIcon } from './Icons.jsx';

export default function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [img, setImg] = useState({ file: null, url: '' });
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null); // id komentar yang menunggu konfirmasi hapus
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.comments(postId).then((r) => setComments(r.comments)).catch((e) => notify(e.message, 'error'));
  }, [postId, notify]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !img.file && !img.url.trim()) return notify('Tulis komentar atau lampirkan gambar.', 'warning');
    setSending(true);
    try {
      const { comment } = await api.createComment(
        postId,
        toFormData({ comment: text, image: img.file, image_url: img.url })
      );
      setComments((c) => [...(c || []), comment]);
      onCountChange(1);
      setText('');
      setImg({ file: null, url: '' });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (id, form) => {
    const { comment } = await api.updateComment(postId, id, form);
    setComments((list) => list.map((c) => (c.id === id ? comment : c)));
    setEditingId(null);
    notify('Komentar diperbarui.', 'success');
  };

  const confirmRemove = async () => {
    setDeleting(true);
    try {
      await api.deleteComment(postId, deleteId);
      setComments((list) => list.filter((c) => c.id !== deleteId));
      onCountChange(-1);
      notify('Komentar dihapus.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 border-t border-line bg-mist/50 px-5 py-4">
      {comments === null && <p className="text-sm text-ink-soft">Memuat komentar…</p>}
      {comments?.length === 0 && <p className="text-sm text-ink-soft">Belum ada komentar. Mulai percakapan.</p>}

      <ul className="space-y-3">
        {comments?.map((c) => {
          const mine = c.author.id === user.id;
          return (
            <li key={c.id} className="flex gap-3">
              <Avatar user={c.author} size={32} />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-bold">{c.author.name}</span>
                  <time className="text-xs text-ink-soft" dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                  {mine && editingId !== c.id && (
                    <span className="ml-auto flex gap-1.5">
                      <button onClick={() => setEditingId(c.id)} className="btn-edit" aria-label="Edit komentar">
                        <PencilIcon /> Edit
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="btn-delete" aria-label="Hapus komentar">
                        <TrashIcon /> Hapus
                      </button>
                    </span>
                  )}
                </div>

                {editingId === c.id ? (
                  <div className="mt-2">
                    <EditBox
                      textField="comment"
                      multiline={false}
                      initialText={c.comment}
                      currentImage={c.image}
                      onSave={(form) => saveEdit(c.id, form)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <>
                    {c.comment && <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{c.comment}</p>}
                    {c.image && <img src={c.image} alt="Lampiran komentar" className="mt-2 max-h-60 rounded-xl border border-line" loading="lazy" />}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Tulis komentar…"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            aria-label="Komentar"
          />
          <button className="btn-primary" disabled={sending}>{sending ? 'Mengirim…' : 'Kirim'}</button>
        </div>
        <ImagePicker value={img} onChange={setImg} onError={(m) => notify(m, 'error')} label="Gambar" />
      </form>

      {deleteId !== null && (
        <ConfirmDialog
          title="Hapus komentar ini?"
          message="Komentar akan dihapus permanen dan tidak bisa dikembalikan."
          confirmText="Ya, hapus"
          loading={deleting}
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}