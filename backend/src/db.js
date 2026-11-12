import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'connectspace_jar',
};

export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
});

// Semua waktu disimpan & dibaca dalam UTC; frontend yang mengubah ke zona lokal.
pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));
