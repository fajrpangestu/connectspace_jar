import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class HttpError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const regenerateSession = (req) =>
  new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
export const destroySession = (req) =>
  new Promise((resolve, reject) => req.session.destroy((e) => (e ? reject(e) : resolve())));

// Hapus berkas hanya jika berupa upload lokal (bukan URL eksternal).
export function removeLocalImage(p) {
  if (typeof p === 'string' && p.startsWith('/uploads/')) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(p)), () => {});
  }
}

export const toId = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'ID tidak valid');
  return n;
};
