import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { screenResumes, getCandidates, getCandidateById } from '../controllers/resumeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const uploadDir = 'uploads/resumes';
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
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

router.post('/screen', requireAuth, requireAdmin, upload.array('resumes', 10), screenResumes);
router.get('/', requireAuth, getCandidates);
router.get('/:id', requireAuth, getCandidateById);

export default router;
