import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { dbConfig } from './db.js';
import { UPLOAD_DIR } from './utils.js';
import { notFound, errorHandler } from './middleware.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';

const MySQLStore = MySQLStoreFactory(session);
const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Sesi disimpan di MySQL (tabel `sessions` dibuat otomatis)
app.use(
  session({
    name: 'connectspace_jar.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-ganti-di-produksi',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(dbConfig),
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`connectspace_jar API berjalan di http://localhost:${port}`));
