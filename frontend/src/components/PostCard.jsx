import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api, timeAgo } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import CommentSection from './CommentSection.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import EditBox from './EditBox.jsx';
import { PencilIcon, TrashIcon } from './Icons.jsx';

export default function PostCard({ post, onChange, onDelete }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = post.user_id === user.id;

  const like = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.toggleLike(post.id); // angka final selalu dari server
      onChange({ ...post, liked: r.liked, like_count: r.like_count });
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.deletePost(post.id);
      onDelete(post.id);
      notify('Postingan dihapus.', 'success');
    } catch (e) {
      notify(e.message, 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const save = async (form) => {
    const { post: updated } = await api.updatePost(post.id, form);
    onChange(updated);
    setEditing(false);
    notify('Postingan diperbarui.', 'success');
  };

  return (
    <>
      <article className="card overflow-hidden">
        <div className="p-5">
          <header className="flex items-start gap-3">
            <Link to={`/u/${post.author.id}`} aria-label={`Profil ${post.author.name}`}>
              <Avatar user={post.author} size={44} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/u/${post.author.id}`} className="block truncate font-bold leading-tight hover:text-brand">
                {post.author.name}
              </Link>
              <p className="text-xs text-ink-soft">
                <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
                {post.updated_at && <span> · diedit</span>}
              </p>
            </div>
            {isOwner && !editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="btn-edit" aria-label="Edit postingan">
                  <PencilIcon /> Edit
                </button>
                <button onClick={() => setConfirmDelete(true)} className="btn-delete" aria-label="Hapus postingan">
                  <TrashIcon /> Hapus
                </button>
              </div>
            )}
          </header>

          {editing ? (
            <div className="mt-4">
              <EditBox
                textField="content"
                initialText={post.content}
                currentImage={post.image}
                onSave={save}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <>
              {post.content && <p className="mt-4 whitespace-pre-wrap break-words text-[16px] leading-relaxed">{post.content}</p>}
              {post.image && (
                <img src={post.image} alt="Lampiran postingan" className="mt-4 max-h-[28rem] w-full rounded-xl border border-line object-cover" loading="lazy" />
              )}
            </>
          )}
        </div>

        <footer className="flex items-center gap-1 border-t border-line px-3 py-2">
          <button
            onClick={like}
            disabled={busy}
            aria-pressed={post.liked}
            className={`btn !px-3 !py-1.5 ${post.liked ? 'bg-red-50 text-heart' : 'text-ink-soft hover:bg-mist'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.4 5c2 0 3.6 1.1 5.6 3.2C14 6.1 15.6 5 17.6 5 21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
            </svg>
            {post.liked ? 'Disukai' : 'Suka'} · {post.like_count}
          </button>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn text-ink-soft hover:bg-mist !px-3 !py-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-5.2A8 8 0 1 1 21 12z" strokeLinejoin="round" />
            </svg>
            Komentar · {post.comment_count}
          </button>
        </footer>

        {open && <CommentSection postId={post.id} onCountChange={(d) => onChange({ ...post, comment_count: post.comment_count + d })} />}
      </article>

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus postingan ini?"
          message="Postingan beserta seluruh like dan komentarnya akan dihapus permanen dan tidak bisa dikembalikan."
          confirmText="Ya, hapus"
          loading={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}