-- Jalankan SEKALI pada database connectspace yang sudah ada
USE connectspace;

ALTER TABLE comments
  ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER post_id,
  ADD KEY idx_comments_parent (parent_id),
  ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
    REFERENCES comments (id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS comment_likes (
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
) ENGINE=InnoDB;
