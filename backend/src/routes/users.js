import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware.js';
import { HttpError, wrap, toId } from '../utils.js';

const router = Router();
router.use(requireAuth);

// Profil publik: tanpa email
router.get(
  '/:id',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.avatar, u.bio, u.created_at,
              (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id)    AS post_count,
              (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comment_count,
              (SELECT COUNT(*) FROM likes l JOIN posts p ON p.id = l.post_id WHERE p.user_id = u.id) AS like_received
       FROM users u WHERE u.id = ?`,
      [id]
    );
    if (!rows.length) throw new HttpError(404, 'Pengguna tidak ditemukan');
    const r = rows[0];
    res.json({
      user: {
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        bio: r.bio,
        created_at: r.created_at,
        post_count: Number(r.post_count),
        comment_count: Number(r.comment_count),
        like_received: Number(r.like_received),
      },
    });
  })
);

// Postingan milik satu pengguna (terbaru di atas)
router.get(
  '/:id/posts',
  wrap(async (req, res) => {
    const id = toId(req.params.id);
    const [rows] = await pool.execute(
      `SELECT p.id, p.user_id, p.content, p.image, p.created_at, p.updated_at,
              u.name AS author_name, u.avatar AS author_avatar,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id)    AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT 100`,
      [req.session.userId, id]
    );
    res.json({
      posts: rows.map((r) => ({
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
      })),
    });
  })
);

export default router;
