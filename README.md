# ConnectSpace (React + Express + MySQL + Tailwind CSS)

MVP media sosial internal sesuai dokumen UJK Junior Web Programmer.

## Prasyarat
Node.js 18+ dan MySQL 8 (atau MariaDB 10.4+).

## Menjalankan

### 1. Backend
```bash
cd backend
cp .env.example .env      # isi DB_USER / DB_PASSWORD / SESSION_SECRET
npm install
npm run db:init           # membuat database + 4 tabel dari schema.sql
npm run dev               # http://localhost:4000
```
Tabel `sessions` (penyimpan sesi) dibuat otomatis saat server pertama kali jalan.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```
Vite mem-proxy `/api` dan `/uploads` ke port 4000, jadi cookie sesi bersifat same-origin.

## Pemetaan ke rubrik penilaian
| Rubrik | Implementasi |
|---|---|
| 1. Struktur & relasi DB | `backend/schema.sql`: users, posts, likes, comments, FK ON DELETE CASCADE, `UNIQUE (user_id, post_id)` pada likes |
| 2. Registrasi & auto-login | `routes/auth.js` (validasi, bcrypt; TIDAK auto-login), `pages/Register.jsx` redirect ke halaman Login |
| 3. Auth & route guard | `middleware.js` (`requireAuth`, `requireGuest`), `App.jsx` (`ProtectedRoute`, `GuestRoute`), logout menghancurkan sesi |
| 4. Profil & foto | `routes/profile.js`, `pages/Profile.jsx`; avatar tampil di navbar, postingan, komentar; ubah password verifikasi password lama |
| 5. CRUD status | `routes/posts.js`; urut terbaru; hapus hanya pemilik (dicek di server + tombol hanya tampil untuk pemilik) |
| 6. Like toggle & komentar gambar | `POST /api/posts/:id/like`, `/comments` dengan upload/URL gambar |
| 7. Keamanan | Semua query prepared statement (`mysql2 execute`), upload dibatasi tipe/ukuran + cek magic bytes + nama acak, cookie `httpOnly` |

## Endpoint API
`POST /api/auth/register|login|logout`, `GET /api/auth/me`,
`PUT /api/profile`, `PUT /api/profile/password`,
`GET|POST /api/posts`, `DELETE /api/posts/:id`, `POST /api/posts/:id/like`,
`GET|POST /api/posts/:id/comments`.

## Produksi
Set `NODE_ENV=production` (cookie `secure`), `CLIENT_URL`, dan `SESSION_SECRET` yang kuat; layani hasil `npm run build` frontend lewat web server yang mem-proxy `/api` dan `/uploads` ke Express.
