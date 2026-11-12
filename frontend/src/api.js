// Pembungkus fetch: cookie sesi dikirim otomatis, error dinormalisasi.
async function request(path, { method = 'GET', body, form } = {}) {
  const opts = { method, credentials: 'include', headers: {} };
  if (form) opts.body = form;
  else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Sesi habis saat memakai halaman terproteksi -> beri tahu AuthContext
    if (res.status === 401 && !path.startsWith('/auth')) window.dispatchEvent(new Event('auth:expired'));
    const err = new Error(data.message || 'Terjadi kesalahan');
    err.status = res.status;
    err.errors = data.errors || {};
    throw err;
  }
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  updateProfile: (form) => request('/profile', { method: 'PUT', form }),
  changePassword: (body) => request('/profile/password', { method: 'PUT', body }),

  posts: () => request('/posts'),
  createPost: (form) => request('/posts', { method: 'POST', form }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  comments: (id) => request(`/posts/${id}/comments`),
  createComment: (id, form) => request(`/posts/${id}/comments`, { method: 'POST', form }),
  updatePost: (id, form) => request(`/posts/${id}`, { method: 'PUT', form }),
  updateComment: (id, cid, form) => request(`/posts/${id}/comments/${cid}`, { method: 'PUT', form }),
  deleteComment: (id, cid) => request(`/posts/${id}/comments/${cid}`, { method: 'DELETE' }),
};

// Bentuk FormData; field kosong dilewati.
export function toFormData(fields) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') fd.append(k, v);
  });
  return fd;
}

export function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
