import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDirectory = process.env.UPLOAD_DIR || 'uploads';
const taskUploadDir = path.join(uploadDirectory, 'tasks');

if (!fs.existsSync(taskUploadDir)) {
  fs.mkdirSync(taskUploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, taskUploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate safe, unique filename: timestamp-random-cleanedOriginalName
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, sanitizedExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// Allowed file types: images, PDFs, docs, spreadsheets, zip archives
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images, PDF, Office docs, Text, ZIP`));
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

export const uploadTaskAttachments = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // 10MB default
    files: 5, // Up to 5 files per request
  },
  fileFilter,
});
