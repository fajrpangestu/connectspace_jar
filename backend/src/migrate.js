import { pool } from './db.js';

// Migrasi otomatis & idempotent: aman dijalankan setiap server start.
// Menambahkan fitur balasan komentar (comments.parent_id) dan like komentar (comment_likes).
export async function ensureSchema() {
  const [cols] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'parent_id'`
  );
  if (!Number(cols[0].n)) {
    await pool.query(
      `ALTER TABLE comments
         ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER post_id,
         ADD KEY idx_comments_parent (parent_id),
         ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
           REFERENCES comments (id) ON DELETE CASCADE`
    );
    console.log('Migrasi: kolom comments.parent_id ditambahkan');
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS comment_likes (
       id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
       user_id    BIGINT UNSIGNED NOT NULL,
       comment_id BIGINT UNSIGNED NOT NULL,
       created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_comment_likes (user_id, comment_id),
       KEY idx_comment_likes_comment (comment_id),
       CONSTRAINT fk_cl_user FOREIGN KEY (user_id)
         REFERENCES users (id) ON DELETE CASCADE,
       CONSTRAINT fk_cl_comment FOREIGN KEY (comment_id)
         REFERENCES comments (id) ON DELETE CASCADE
     ) ENGINE=InnoDB`
  );
}
