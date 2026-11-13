-- ConnectSpace: skema basis data (MySQL 8 / MariaDB 10.4+)
CREATE DATABASE IF NOT EXISTS connectspace
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE connectspace;

CREATE TABLE IF NOT EXISTS users (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,
  email      VARCHAR(150)    NOT NULL,
  password   VARCHAR(255)    NOT NULL,           -- hash bcrypt
  avatar     VARCHAR(255)    NULL,               -- path file / URL foto profil
  bio        TEXT            NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  content    TEXT            NULL,               -- opsional jika gambar ada
  image      VARCHAR(255)    NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_posts_created (created_at),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS likes (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  post_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_likes_user_post (user_id, post_id),  -- 1 user = 1 like per post
  KEY idx_likes_post (post_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id)
    REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    BIGINT UNSIGNED NOT NULL,
  parent_id  BIGINT UNSIGNED NULL,               -- balasan: menunjuk ke komentar induk
  user_id    BIGINT UNSIGNED NOT NULL,
  comment    TEXT            NULL,
  image      VARCHAR(255)    NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_post (post_id, created_at),
  KEY idx_comments_parent (parent_id),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
    REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
    REFERENCES comments (id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
