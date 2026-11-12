import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import PostForm from '../components/PostForm.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Feed() {
  const { notify } = useToast();
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    api.posts().then((r) => setPosts(r.posts)).catch((e) => e.status !== 401 && notify(e.message, 'error'));
  }, [notify]);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <PostForm onCreated={(p) => setPosts((list) => [p, ...(list || [])])} />

      {posts === null && <p className="py-10 text-center text-ink-soft">Memuat beranda…</p>}
      {posts?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="font-bold">Beranda masih kosong</p>
          <p className="mt-1 text-sm text-ink-soft">Terbitkan status pertama untuk membuka percakapan.</p>
        </div>
      )}
      {posts?.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onChange={(np) => setPosts((list) => list.map((x) => (x.id === np.id ? np : x)))}
          onDelete={(id) => setPosts((list) => list.filter((x) => x.id !== id))}
        />
      ))}
    </main>
  );
}
