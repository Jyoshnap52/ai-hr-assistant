import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/documentController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

const router = express.Router();

router.post('/upload', requireAuth, requireAdmin, upload.single('file'), uploadDocument);
router.get('/', requireAuth, getDocuments);
router.delete('/:id', requireAuth, requireAdmin, deleteDocument);

export default router;
