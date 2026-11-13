import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';
import { imageUpload, resolveImage } from '../upload.js';
import { HttpError, wrap, toId, removeLocalImage } from '../utils.js';

// Dipasang di /api/posts, jadi URL-nya: /api/posts/:id/comments/...
const router = Router();
router.use(requireAuth);

const COMMENT_SELECT = `
  SELECT c.id, c.post_id, c.parent_id, c.user_id, c.comment, c.image, c.created_at,
         u.name AS author_name, u.avatar AS author_avatar,
         (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
         EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked
  FROM comments c
  JOIN users u ON u.id = c.user_id`;

const shapeComment = (r) => ({
  id: r.id,
  post_id: r.post_id,
  parent_id: r.parent_id,
  comment: r.comment,
  image: r.image,
  created_at: r.created_at,
  author: { id: r.user_id, name: r.author_name, avatar: r.author_avatar },
  like_count: Number(r.like_count),
  liked: Boolean(r.liked),
});

// Daftar komentar + balasan (datar, dikelompokkan di frontend lewat parent_id)
router.get(
  '/:id/comments',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const [rows] = await pool.execute(
      `${COMMENT_SELECT} WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC`,
      [req.session.userId, id]
    );
    res.json({ comments: rows.map(shapeComment) });
  })
);

// Kirim komentar atau balasan (parent_id opsional)
router.post(
  '/:id/comments',
  imageUpload('image'),
  wrap(async (req, res) => {
    const postId = toId(req.params.id);
    const uid = req.session.userId;
    const comment = String(req.body.comment ?? '').trim();
    const img = resolveImage(req, 'image_url');
    if (img.error) throw new HttpError(422, img.error, { image: img.error });
    if (comment.length > 1000) throw new HttpError(422, 'Komentar maksimal 1000 karakter');
    if (!comment && !img.value) throw new HttpError(422, 'Komentar tidak boleh kosong: isi teks atau lampirkan gambar');

    const [post] = await pool.execute('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post.length) throw new HttpError(404, 'Postingan tidak ditemukan');

    // Balasan hanya 1 tingkat: membalas sebuah balasan otomatis menempel ke komentar induknya
    let parentId = null;
    if (req.body.parent_id) {
      const pid = toId(req.body.parent_id);
      const [p] = await pool.execute('SELECT id, post_id, parent_id FROM comments WHERE id = ?', [pid]);
      if (!p.length || p[0].post_id !== postId) throw new HttpError(404, 'Komentar yang dibalas tidak ditemukan');
      parentId = p[0].parent_id ?? p[0].id;
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, parent_id, user_id, comment, image) VALUES (?, ?, ?, ?, ?)',
      [postId, parentId, uid, comment || null, img.value]
    );
    const [rows] = await pool.execute(`${COMMENT_SELECT} WHERE c.id = ?`, [uid, result.insertId]);
    res.status(201).json({ comment: shapeComment(rows[0]) });
  })
);

// Edit komentar/balasan: hanya pemilik
router.put(
  '/:id/comments/:commentId',
  imageUpload('image'),
  wrap(async (req, res) => {
    const postId = toId(req.params.id);
    const commentId = toId(req.params.commentId);
    const uid = req.session.userId;
    const [rows] = await pool.execute('SELECT user_id, image FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
    if (!rows.length) throw new HttpError(404, 'Komentar tidak ditemukan');
    if (rows[0].user_id !== uid) throw new HttpError(403, 'Anda tidak berhak mengedit komentar ini');

    const comment = String(req.body.comment ?? '').trim();
    if (comment.length > 1000) throw new HttpError(422, 'Komentar maksimal 1000 karakter');

    let image = rows[0].image;
    const img = resolveImage(req, 'image_url');
    if (img.error) throw new HttpError(422, img.error, { image: img.error });
    if (img.value) image = img.value;
    else if (req.body.remove_image === 'true') image = null;

    if (!comment && !image) throw new HttpError(422, 'Komentar tidak boleh kosong: isi teks atau lampirkan gambar');

    await pool.execute('UPDATE comments SET comment = ?, image = ? WHERE id = ?', [comment || null, image, commentId]);
    if (image !== rows[0].image) removeLocalImage(rows[0].image);

    const [out] = await pool.execute(`${COMMENT_SELECT} WHERE c.id = ?`, [uid, commentId]);
    res.json({ comment: shapeComment(out[0]) });
  })
);

// Hapus komentar/balasan: hanya pemilik. Menghapus komentar induk ikut menghapus balasannya.
router.delete(
  '/:id/comments/:commentId',
  wrap(async (req, res) => {
    const postId = toId(req.params.id);
    const commentId = toId(req.params.commentId);
    const [rows] = await pool.execute('SELECT user_id, image FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
    if (!rows.length) throw new HttpError(404, 'Komentar tidak ditemukan');
    if (rows[0].user_id !== req.session.userId) throw new HttpError(403, 'Anda tidak berhak menghapus komentar ini');

    const [replyImgs] = await pool.execute('SELECT image FROM comments WHERE parent_id = ? AND image IS NOT NULL', [commentId]);
    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]); // balasan & like ikut terhapus (CASCADE)
    removeLocalImage(rows[0].image);
    replyImgs.forEach((r) => removeLocalImage(r.image));
    res.json({ message: 'Komentar dihapus' });
  })
);

// Like komentar/balasan (toggle): 1 user = 1 like per komentar
router.post(
  '/:id/comments/:commentId/like',
  wrap(async (req, res) => {
    const postId = toId(req.params.id);
    const commentId = toId(req.params.commentId);
    const uid = req.session.userId;
    const [c] = await pool.execute('SELECT id FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
    if (!c.length) throw new HttpError(404, 'Komentar tidak ditemukan');

    let liked;
    const [del] = await pool.execute('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [uid, commentId]);
    if (del.affectedRows > 0) {
      liked = false;
    } else {
      try {
        await pool.execute('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [uid, commentId]);
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
      liked = true;
    }
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM comment_likes WHERE comment_id = ?', [commentId]);
    res.json({ liked, like_count: Number(total) });
  })
);

export default router;
