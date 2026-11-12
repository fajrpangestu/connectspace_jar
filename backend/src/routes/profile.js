import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';
import { imageUpload, resolveImage } from '../upload.js';
import { HttpError, wrap, removeLocalImage } from '../utils.js';
import { getUser } from './auth.js';

const router = Router();
router.use(requireAuth);

// Ubah nama, bio, dan foto profil (upload file atau URL)
router.put(
  '/',
  imageUpload('avatar'),
  wrap(async (req, res) => {
    const uid = req.session.userId;
    const name = String(req.body.name ?? '').trim();
    const bio = String(req.body.bio ?? '').trim();

    const errors = {};
    if (!name) errors.name = 'Nama pengguna wajib diisi';
    else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter';
    if (bio.length > 500) errors.bio = 'Bio maksimal 500 karakter';

    const current = await getUser(uid);
    let avatar = current.avatar;
    const img = resolveImage(req, 'avatar_url');
    if (img.error) errors.avatar = img.error;
    else if (img.value) avatar = img.value;
    else if (req.body.remove_avatar === 'true') avatar = null;

    if (Object.keys(errors).length) throw new HttpError(422, 'Periksa kembali isian formulir', errors);

    await pool.execute('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?', [
      name,
      bio || null,
      avatar,
      uid,
    ]);
    if (avatar !== current.avatar) removeLocalImage(current.avatar);
    res.json({ user: await getUser(uid) });
  })
);

// Ubah password: wajib verifikasi password lama
router.put(
  '/password',
  wrap(async (req, res) => {
    const uid = req.session.userId;
    const { old_password = '', new_password = '', confirm_new_password = '' } = req.body;

    const errors = {};
    if (!old_password) errors.old_password = 'Password lama wajib diisi';
    if (!new_password) errors.new_password = 'Password baru wajib diisi';
    else if (new_password.length < 6) errors.new_password = 'Password baru minimal 6 karakter';
    else if (new_password.length > 72) errors.new_password = 'Password maksimal 72 karakter';
    if (!confirm_new_password) errors.confirm_new_password = 'Konfirmasi password baru wajib diisi';
    else if (new_password !== confirm_new_password) errors.confirm_new_password = 'Konfirmasi password tidak cocok';
    if (Object.keys(errors).length) throw new HttpError(422, 'Periksa kembali isian formulir', errors);

    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [uid]);
    if (!rows.length || !(await bcrypt.compare(old_password, rows[0].password))) {
      throw new HttpError(422, 'Password lama tidak sesuai', { old_password: 'Password lama tidak sesuai' });
    }
    if (old_password === new_password) {
      throw new HttpError(422, 'Password baru harus berbeda', { new_password: 'Password baru harus berbeda dari password lama' });
    }

    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(new_password, 10), uid]);
    res.json({ message: 'Password berhasil diubah' });
  })
);

export default router;
