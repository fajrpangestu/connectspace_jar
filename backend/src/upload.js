import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { HttpError, UPLOAD_DIR } from './utils.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // Nama acak: nama asli dari pengguna tidak pernah dipakai.
    filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype]
      ? cb(null, true)
      : cb(new HttpError(400, 'Format gambar harus JPG, PNG, GIF, atau WEBP')),
});

// Verifikasi isi berkas (magic bytes), bukan hanya header MIME dari klien.
function looksLikeImage(b) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const gif = b.subarray(0, 4).toString('ascii') === 'GIF8';
  const webp = b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || gif || webp;
}

export function imageUpload(field) {
  const single = upload.single(field);
  return (req, res, next) =>
    single(req, res, (err) => {
      if (err) return next(err);
      if (req.file) {
        const buf = Buffer.alloc(12);
        const fd = fs.openSync(req.file.path, 'r');
        fs.readSync(fd, buf, 0, 12, 0);
        fs.closeSync(fd);
        if (!looksLikeImage(buf)) return next(new HttpError(400, 'Berkas yang diunggah bukan gambar yang valid'));
      }
      next();
    });
}

// Hasilkan nilai kolom gambar: file upload ATAU URL http(s) yang valid.
export function resolveImage(req, urlField) {
  if (req.file) return { value: `/uploads/${req.file.filename}` };
  const raw = String(req.body?.[urlField] ?? '').trim();
  if (!raw) return { value: null };
  if (raw.length > 255) return { error: 'URL gambar terlalu panjang (maksimal 255 karakter)' };
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
  } catch {
    return { error: 'URL gambar tidak valid (harus diawali http:// atau https://)' };
  }
  return { value: raw };
}
