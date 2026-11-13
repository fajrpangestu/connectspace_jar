import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';

function Stat({ value, label }) {
  return (
    <div className="px-2 py-4 text-center">
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { notify } = useToast();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const isMe = me.id === Number(id);

  useEffect(() => {
    let alive = true;
    setProfile(null);
    setPosts(null);
    setNotFound(false);

    Promise.all([api.user(id), api.userPosts(id)])
      .then(([u, p]) => {
        if (!alive) return;
        setProfile(u.user);
        setPosts(p.posts);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.status === 404 || e.status === 400) setNotFound(true);
        else if (e.status !== 401) notify(e.message, 'error');
      });

    return () => { alive = false; };
  }, [id, notify]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="card p-10 text-center">
          <p className="font-bold">Pengguna tidak ditemukan</p>
          <Link to="/" className="btn-primary mt-4">Kembali ke Beranda</Link>
        </div>
      </main>
    );
  }

  if (!profile) return <p className="py-16 text-center text-ink-soft">Memuat profil…</p>;

  const joined = new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <section className="card overflow-hidden">
        <div className="h-28 bg-ink" />
        <div className="px-6 pb-2">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <span className="rounded-full ring-4 ring-white">
              <Avatar key={profile.avatar || 'none'} user={profile} size={96} />
            </span>
            {isMe && (
              <Link to="/profile" className="btn-primary">Edit profil</Link>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
            {isMe && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">Anda</span>}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">Bergabung {joined}</p>

          <p className={`mt-4 whitespace-pre-wrap break-words ${profile.bio ? '' : 'italic text-ink-soft'}`}>
            {profile.bio || 'Belum ada bio.'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line">
          <Stat value={profile.post_count} label="Postingan" />
          <Stat value={profile.comment_count} label="Komentar" />
          <Stat value={profile.like_received} label="Suka diterima" />
        </div>
      </section>

      <h2 className="px-1 text-lg font-extrabold">{isMe ? 'Postingan Anda' : `Postingan ${profile.name.split(' ')[0]}`}</h2>

      {posts === null && <p className="py-6 text-center text-ink-soft">Memuat postingan…</p>}
      {posts?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="font-bold">Belum ada postingan</p>
          <p className="mt-1 text-sm text-ink-soft">
            {isMe ? 'Terbitkan status pertama Anda dari Beranda.' : 'Pengguna ini belum menerbitkan status.'}
          </p>
        </div>
      )}
      {posts?.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onChange={(np) => setPosts((list) => list.map((x) => (x.id === np.id ? np : x)))}
          onDelete={(pid) => {
            setPosts((list) => list.filter((x) => x.id !== pid));
            setProfile((pr) => ({ ...pr, post_count: pr.post_count - 1 }));
          }}
        />
      ))}
    </main>
  );
}
