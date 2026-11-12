import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireGuest } from '../middleware.js';
import { EMAIL_RE, HttpError, wrap, regenerateSession, destroySession } from '../utils.js';

const router = Router();

export async function getUser(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, avatar, bio, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

// Registrasi -> simpan -> arahkan ke form login (tanpa auto-login)
router.post(
  '/register',
  requireGuest,
  wrap(async (req, res) => {
    const name = String(req.body.name ?? '').trim();
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const { password = '', confirm_password = '' } = req.body;

    const errors = {};
    if (!name) errors.name = 'Nama lengkap wajib diisi';
    else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter';

    if (!email) errors.email = 'Email wajib diisi';
    else if (!EMAIL_RE.test(email) || email.length > 150) errors.email = 'Format email tidak valid';

    if (!password) errors.password = 'Password wajib diisi';
    else if (password.length < 6) errors.password = 'Password minimal 6 karakter';
    else if (password.length > 72) errors.password = 'Password maksimal 72 karakter';

    if (!confirm_password) errors.confirm_password = 'Konfirmasi password wajib diisi';
    else if (password !== confirm_password) errors.confirm_password = 'Konfirmasi password tidak cocok';

    if (!errors.email) {
      const [dup] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (dup.length) errors.email = 'Email sudah terdaftar';
    }
    if (Object.keys(errors).length) throw new HttpError(422, 'Periksa kembali isian formulir', errors);

    const hash = await bcrypt.hash(password, 10);
    let id;
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hash]
      );
      id = result.insertId;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') throw new HttpError(422, 'Email sudah terdaftar', { email: 'Email sudah terdaftar' });
      throw e;
    }

    // Tidak membuat sesi: pengguna harus login manual setelah mendaftar.
    res.status(201).json({ message: 'Registrasi berhasil, silakan login.', user: await getUser(id) });
  })
);

router.post(
  '/login',
  requireGuest,
  wrap(async (req, res) => {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    const errors = {};
    if (!email) errors.email = 'Email wajib diisi';
    if (!password) errors.password = 'Password wajib diisi';
    if (Object.keys(errors).length) throw new HttpError(422, 'Email dan password wajib diisi', errors);

    const [rows] = await pool.execute('SELECT id, password FROM users WHERE email = ?', [email]);
    const ok = rows.length && (await bcrypt.compare(password, rows[0].password));
    if (!ok) throw new HttpError(401, 'Email atau password salah');

    await regenerateSession(req);
    req.session.userId = rows[0].id;
    res.json({ user: await getUser(rows[0].id) });
  })
);

router.post(
  '/logout',
  wrap(async (req, res) => {
    if (req.session) await destroySession(req);
    res.clearCookie('connectspace.sid');
    res.json({ message: 'Anda telah keluar' });
  })
);

router.get(
  '/me',
  wrap(async (req, res) => {
    if (!req.session?.userId) throw new HttpError(401, 'Belum login');
    const user = await getUser(req.session.userId);
    if (!user) {
      await destroySession(req);
      throw new HttpError(401, 'Belum login');
    }
    res.json({ user });
  })
);

export default router;
