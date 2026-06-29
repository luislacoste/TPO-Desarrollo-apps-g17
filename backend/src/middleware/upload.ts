import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

const uploadDir = path.resolve(env.uploads.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${id}${ext}`);
  },
});

const ACCEPTED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
  'image/heic', 'image/heif',  // iOS default camera format
]);

export const upload = multer({
  storage,
  limits: { fileSize: env.uploads.maxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED.has(file.mimetype)) {
      return cb(new Error(`Formato no soportado: ${file.mimetype}`));
    }
    cb(null, true);
  },
});
