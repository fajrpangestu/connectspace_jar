import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo, toFormData } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from './Avatar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import EditBox from './EditBox.jsx';
import ImagePicker from './ImagePicker.jsx';
import { HeartIcon, PencilIcon, ReplyIcon, TrashIcon } from './Icons.jsx';

// Form kirim komentar (parentId = null) atau balasan (parentId = id komentar induk)
function CommentForm({ postId, parentId = null, initialText = '', placeholder, autoFocus = false, onDone, onCancel }) {
  const { notify } = useToast();
  const [text, setText] = useState(initialText);
  const [img, setImg] = useState({ file: null, url: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const hasImage = img.file || img.url.trim();
    if ((!text.trim() || text.trim() === initialText.trim()) && !hasImage) {
      return notify('Tulis komentar atau lampirkan gambar.', 'warning');
    }
    setSending(true);
    try {
      const { comment } = await api.createComment(
        postId,
        toFormData({ comment: text, image: img.file, image_url: img.url, parent_id: parentId })
      );
      onDone(comment);
      setText('');
      setImg({ file: null, url: '' });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={text}
          maxLength={1000}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          aria-label={placeholder}
        />
        <button className="btn-primary" disabled={sending}>{sending ? 'Mengirim…' : 'Kirim'}</button>
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel} disabled={sending}>Batal</button>
        )}
      </div>
      <ImagePicker value={img} onChange={setImg} onError={(m) => notify(m, 'error')} label="Gambar" />
    </form>
  );
}

// Satu komentar atau balasan
function CommentItem({ c, isReply, meId, editingId, setEditingId, onSaveEdit, onAskDelete, onLike, onReply }) {
  const mine = c.author.id === meId;
  const editing = editingId === c.id;

  return (
    <div className="flex gap-3">
      <Link to={`/u/${c.author.id}`} aria-label={`Profil ${c.author.name}`} className="shrink-0">
        <Avatar user={c.author} size={isReply ? 28 : 32} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/u/${c.author.id}`} className="text-sm font-bold hover:text-brand">{c.author.name}</Link>
            <time className="text-xs text-ink-soft" dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
            {mine && !editing && (
              <span className="ml-auto flex gap-1.5">
                <button onClick={() => setEditingId(c.id)} className="btn-edit" aria-label="Edit komentar">
                  <PencilIcon /> Edit
                </button>
                <button onClick={() => onAskDelete(c)} className="btn-delete" aria-label="Hapus komentar">
                  <TrashIcon /> Hapus
                </button>
              </span>
            )}
          </div>

          {editing ? (
            <div className="mt-2">
              <EditBox
                textField="comment"
                multiline={false}
                initialText={c.comment}
                currentImage={c.image}
                onSave={(form) => onSaveEdit(c.id, form)}
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

        {!editing && (
          <div className="mt-1 flex items-center gap-1 pl-1">
            <button
              onClick={() => onLike(c)}
              aria-pressed={c.liked}
              aria-label={c.liked ? 'Batal suka' : 'Suka'}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                c.liked ? 'bg-red-50 text-heart' : 'text-ink-soft hover:bg-white hover:text-heart'
              }`}
            >
              <HeartIcon filled={c.liked} />
              {c.liked ? 'Disukai' : 'Suka'}{c.like_count > 0 && ` · ${c.like_count}`}
            </button>
            <button
              onClick={() => onReply(c)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-white hover:text-brand"
            >
              <ReplyIcon /> Balas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [comments, setComments] = useState(null); // daftar datar: komentar + balasan
  const [editingId, setEditingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // { rootId, prefill }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.comments(postId).then((r) => setComments(r.comments)).catch((e) => notify(e.message, 'error'));
  }, [postId, notify]);

  const roots = (comments || []).filter((c) => !c.parent_id);
  const repliesOf = (id) => (comments || []).filter((c) => c.parent_id === id);

  const added = (comment) => {
    setComments((list) => [...(list || []), comment]);
    onCountChange(1);
  };

  const saveEdit = async (id, form) => {
    const { comment } = await api.updateComment(postId, id, form);
    setComments((list) => list.map((c) => (c.id === id ? comment : c)));
    setEditingId(null);
    notify('Komentar diperbarui.', 'success');
  };

  const like = async (c) => {
    try {
      const r = await api.likeComment(postId, c.id); // angka final dari server
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, liked: r.liked, like_count: r.like_count } : x)));
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Membalas sebuah balasan tetap menempel ke komentar induknya (maksimal 1 tingkat)
  const startReply = (c) => {
    const rootId = c.parent_id ?? c.id;
    const prefill = c.parent_id ? `@${c.author.name.split(' ')[0]} ` : '';
    setReplyTo({ rootId, prefill, key: `${c.id}-${Date.now()}` });
  };

  const confirmRemove = async () => {
    const target = deleteTarget;
    setDeleting(true);
    try {
      await api.deleteComment(postId, target.id);
      const removedIds = [target.id, ...repliesOf(target.id).map((r) => r.id)];
      setComments((list) => list.filter((c) => !removedIds.includes(c.id)));
      onCountChange(-removedIds.length);
      notify(removedIds.length > 1 ? 'Komentar dan balasannya dihapus.' : 'Komentar dihapus.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const deleteCount = deleteTarget ? repliesOf(deleteTarget.id).length : 0;
  const itemProps = { meId: user.id, editingId, setEditingId, onSaveEdit: saveEdit, onAskDelete: setDeleteTarget, onLike: like, onReply: startReply };

  return (
    <div className="space-y-4 border-t border-line bg-mist/50 px-5 py-4">
      {comments === null && <p className="text-sm text-ink-soft">Memuat komentar…</p>}
      {comments?.length === 0 && <p className="text-sm text-ink-soft">Belum ada komentar. Mulai percakapan.</p>}

      <ul className="space-y-4">
        {roots.map((c) => {
          const replies = repliesOf(c.id);
          const replying = replyTo?.rootId === c.id;
          return (
            <li key={c.id} className="space-y-2">
              <CommentItem c={c} isReply={false} {...itemProps} />

              {(replies.length > 0 || replying) && (
                <div className="ml-10 space-y-3 border-l-2 border-line pl-3">
                  {replies.map((r) => (
                    <CommentItem key={r.id} c={r} isReply {...itemProps} />
                  ))}
                  {replying && (
                    <CommentForm
                      key={replyTo.key}
                      postId={postId}
                      parentId={c.id}
                      initialText={replyTo.prefill}
                      placeholder="Tulis balasan…"
                      autoFocus
                      onDone={(comment) => { added(comment); setReplyTo(null); }}
                      onCancel={() => setReplyTo(null)}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <CommentForm postId={postId} placeholder="Tulis komentar…" onDone={added} />

      {deleteTarget && (
        <ConfirmDialog
          title={deleteCount > 0 ? 'Hapus komentar beserta balasannya?' : 'Hapus komentar ini?'}
          message={
            deleteCount > 0
              ? `Komentar ini dan ${deleteCount} balasan di bawahnya akan dihapus permanen.`
              : 'Komentar akan dihapus permanen dan tidak bisa dikembalikan.'
          }
          confirmText="Ya, hapus"
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
