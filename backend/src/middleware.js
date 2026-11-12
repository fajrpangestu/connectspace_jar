import fs from 'node:fs';
import { HttpError } from './utils.js';

export function requireAuth(req, res, next) {
  if (!req.session?.userId) return next(new HttpError(401, 'Silakan login terlebih dahulu.'));
  next();
}

export function requireGuest(req, res, next) {
  if (req.session?.userId) return next(new HttpError(403, 'Anda sudah login.'));
  next();
}

export function notFound(req, res, next) {
  next(new HttpError(404, 'Endpoint tidak ditemukan'));
}

export function errorHandler(err, req, res, next) {
  // Bersihkan berkas upload yang terlanjur tersimpan jika request gagal.
  if (req.file?.path) fs.unlink(req.file.path, () => {});

  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 3 MB' : 'Gagal mengunggah berkas';
  }
  if (status === 500) {
    console.error(err);
    message = 'Terjadi kesalahan pada server';
  }
  res.status(status).json({ message, errors: err.errors || {} });
}
