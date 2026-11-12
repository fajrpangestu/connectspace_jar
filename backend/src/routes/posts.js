import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';
import { imageUpload, resolveImage } from '../upload.js';
import { HttpError, wrap, toId, removeLocalImage } from '../utils.js';

const router = Router();
router.use(requireAuth);

const POST_SELECT = `
  SELECT p.id, p.user_id, p.content, p.image, p.created_at, p.updated_at,
         u.name AS author_name, u.avatar AS author_avatar,
         (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id)    AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
  FROM posts p
  JOIN users u ON u.id = p.user_id`;

const shapePost = (r) => ({
  id: r.id,
  user_id: r.user_id,
  content: r.content,
  image: r.image,
  created_at: r.created_at,
  updated_at: r.updated_at,
  author: { id: r.user_id, name: r.author_name, avatar: r.author_avatar },
  like_count: Number(r.like_count),
  comment_count: Number(r.comment_count),
  liked: Boolean(r.liked),
});

// Feed: terbaru di atas
router.get(
  '/',
  wrap(async (req, res) => {
    const [rows] = await pool.execute(`${POST_SELECT} ORDER BY p.created_at DESC, p.id DESC LIMIT 100`, [
      req.session.userId,
    ]);
    res.json({ posts: rows.map(shapePost) });
  })
);

router.post(
  '/',
  imageUpload('image'),
  wrap(async (req, res) => {
    const content = String(req.body.content ?? '').trim();
    const img = resolveImage(req, 'image_url');
    if (img.error) throw new HttpError(422, img.error, { image: img.error });
    if (content.length > 5000) throw new HttpError(422, 'Teks maksimal 5000 karakter', { content: 'Teks maksimal 5000 karakter' });
    if (!content && !img.value) {
      throw new HttpError(422, 'Status tidak boleh kosong: isi teks atau lampirkan gambar', {
        content: 'Isi teks atau lampirkan gambar',
      });
    }

    const [result] = await pool.execute('INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', [
      req.session.userId,
      content || null,
      img.value,
    ]);
    const [rows] = await pool.execute(`${POST_SELECT} WHERE p.id = ?`, [req.session.userId, result.insertId]);
    res.status(201).json({ post: shapePost(rows[0]) });
  })
);

// Hanya pemilik yang boleh menghapus (divalidasi di server, bukan hanya disembunyikan di UI)
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const [rows] = await pool.execute('SELECT user_id, image FROM posts WHERE id = ?', [id]);
    if (!rows.length) throw new HttpError(404, 'Postingan tidak ditemukan');
    if (rows[0].user_id !== req.session.userId) {
      throw new HttpError(403, 'Anda tidak berhak menghapus postingan ini');
    }
    const [commentImgs] = await pool.execute('SELECT image FROM comments WHERE post_id = ? AND image IS NOT NULL', [id]);
    await pool.execute('DELETE FROM posts WHERE id = ?', [id]); // likes & comments ikut terhapus (CASCADE)
    removeLocalImage(rows[0].image);
    commentImgs.forEach((c) => removeLocalImage(c.image));
    res.json({ message: 'Postingan dihapus' });
  })
);

// Like toggle: 1 user = 1 like per post (dijamin UNIQUE KEY), klik lagi = unlike
router.post(
  '/:id/like',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const uid = req.session.userId;
    const [post] = await pool.execute('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post.length) throw new HttpError(404, 'Postingan tidak ditemukan');

    let liked;
    const [del] = await pool.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [uid, id]);
    if (del.affectedRows > 0) {
      liked = false;
    } else {
      try {
        await pool.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [uid, id]);
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e; // klik ganda bersamaan: tetap 1 like
      }
      liked = true;
    }
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM likes WHERE post_id = ?', [id]);
    res.json({ liked, like_count: Number(total) });
  })
);

router.get(
  '/:id/comments',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const [rows] = await pool.execute(
      `SELECT c.id, c.post_id, c.user_id, c.comment, c.image, c.created_at,
              u.name AS author_name, u.avatar AS author_avatar
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC`,
      [id]
    );
    res.json({ comments: rows.map(shapeComment) });
  })
);

router.post(
  '/:id/comments',
  imageUpload('image'),
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const comment = String(req.body.comment ?? '').trim();
    const img = resolveImage(req, 'image_url');
    if (img.error) throw new HttpError(422, img.error, { image: img.error });
    if (comment.length > 1000) throw new HttpError(422, 'Komentar maksimal 1000 karakter');
    if (!comment && !img.value) throw new HttpError(422, 'Komentar tidak boleh kosong: isi teks atau lampirkan gambar');

    const [post] = await pool.execute('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post.length) throw new HttpError(404, 'Postingan tidak ditemukan');

    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, user_id, comment, image) VALUES (?, ?, ?, ?)',
      [id, req.session.userId, comment || null, img.value]
    );
    const [rows] = await pool.execute(
      `SELECT c.id, c.post_id, c.user_id, c.comment, c.image, c.created_at,
              u.name AS author_name, u.avatar AS author_avatar
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ comment: shapeComment(rows[0]) });
  })
);

const shapeComment = (r) => ({
  id: r.id,
  post_id: r.post_id,
  comment: r.comment,
  image: r.image,
  created_at: r.created_at,
  author: { id: r.user_id, name: r.author_name, avatar: r.author_avatar },
});

// Edit postingan: hanya pemilik
router.put(
  '/:id',
  imageUpload('image'),
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const uid = req.session.userId;
    const [rows] = await pool.execute('SELECT user_id, image FROM posts WHERE id = ?', [id]);
    if (!rows.length) throw new HttpError(404, 'Postingan tidak ditemukan');
    if (rows[0].user_id !== uid) throw new HttpError(403, 'Anda tidak berhak mengedit postingan ini');

    const content = String(req.body.content ?? '').trim();
    if (content.length > 5000) throw new HttpError(422, 'Teks maksimal 5000 karakter');

    let image = rows[0].image;
    const img = resolveImage(req, 'image_url');
    if (img.error) throw new HttpError(422, img.error, { image: img.error });
    if (img.value) image = img.value;
    else if (req.body.remove_image === 'true') image = null;

    if (!content && !image) throw new HttpError(422, 'Status tidak boleh kosong: isi teks atau lampirkan gambar');

    await pool.execute('UPDATE posts SET content = ?, image = ?, updated_at = NOW() WHERE id = ?', [
      content || null,
      image,
      id,
    ]);
    if (image !== rows[0].image) removeLocalImage(rows[0].image);

    const [out] = await pool.execute(`${POST_SELECT} WHERE p.id = ?`, [uid, id]);
    res.json({ post: shapePost(out[0]) });
  })
);

// Edit komentar: hanya pemilik komentar
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

    const [out] = await pool.execute(
      `SELECT c.id, c.post_id, c.user_id, c.comment, c.image, c.created_at,
              u.name AS author_name, u.avatar AS author_avatar
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [commentId]
    );
    res.json({ comment: shapeComment(out[0]) });
  })
);

// Hapus komentar: hanya pemilik komentar
router.delete(
  '/:id/comments/:commentId',
  wrap(async (req, res) => {
    const postId = toId(req.params.id);
    const commentId = toId(req.params.commentId);
    const [rows] = await pool.execute('SELECT user_id, image FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
    if (!rows.length) throw new HttpError(404, 'Komentar tidak ditemukan');
    if (rows[0].user_id !== req.session.userId) throw new HttpError(403, 'Anda tidak berhak menghapus komentar ini');

    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
    removeLocalImage(rows[0].image);
    res.json({ message: 'Komentar dihapus' });
  })
);

export default router;
