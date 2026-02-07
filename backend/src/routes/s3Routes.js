import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  abortMultipartSchema,
  completeMultipartSchema,
  createFolderSchema,
  deleteSchema,
  initiateMultipartSchema,
  listSchema,
  multipartPartUrlSchema,
  presignedPutSchema,
  renameSchema
} from '../utils/validators.js';
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createFolder,
  deleteObject,
  getBucketUsage,
  getMultipartSignedPartUrl,
  getPresignedPutUrl,
  getSignedDownloadUrl,
  initiateMultipartUpload,
  listMultipartUploads,
  listObjects,
  renameObject,
  replaceFile,
  uploadFile
} from '../services/s3Service.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.get(
  '/objects',
  asyncHandler(async (req, res) => {
    const { prefix, continuationToken } = listSchema.parse(req.query);
    const data = await listObjects(prefix, continuationToken);
    res.json({ success: true, data });
  })
);

router.post(
  '/folders',
  asyncHandler(async (req, res) => {
    const { path, folderName } = createFolderSchema.parse(req.body);
    const data = await createFolder(path, folderName);
    res.status(201).json({ success: true, data });
  })
);

router.post(
  '/upload/file',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const key = req.body.key || req.file.originalname;
    await uploadFile({ key, fileBuffer: req.file.buffer, mimeType: req.file.mimetype });

    res.status(201).json({ success: true, data: { key } });
  })
);

router.post(
  '/upload/presigned-put',
  asyncHandler(async (req, res) => {
    const payload = presignedPutSchema.parse(req.body);
    const data = await getPresignedPutUrl(payload);
    res.status(201).json({ success: true, data });
  })
);

router.post(
  '/upload/multipart/initiate',
  asyncHandler(async (req, res) => {
    const payload = initiateMultipartSchema.parse(req.body);
    const data = await initiateMultipartUpload(payload);
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/upload/multipart/part-url',
  asyncHandler(async (req, res) => {
    const payload = multipartPartUrlSchema.parse(req.query);
    const data = await getMultipartSignedPartUrl(payload);
    res.json({ success: true, data });
  })
);

router.post(
  '/upload/multipart/complete',
  asyncHandler(async (req, res) => {
    const payload = completeMultipartSchema.parse(req.body);
    const data = await completeMultipartUpload(payload);
    res.json({ success: true, data });
  })
);

router.post(
  '/upload/multipart/abort',
  asyncHandler(async (req, res) => {
    const payload = abortMultipartSchema.parse(req.body);
    const data = await abortMultipartUpload(payload);
    res.json({ success: true, data });
  })
);

router.get(
  '/upload/multipart/active',
  asyncHandler(async (req, res) => {
    const uploads = await listMultipartUploads(req.query.prefix || '');
    res.json({ success: true, data: uploads });
  })
);

router.put(
  '/objects/replace',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file || !req.body.key) {
      return res.status(400).json({ success: false, message: 'key and file are required' });
    }

    const data = await replaceFile({ key: req.body.key, fileBuffer: req.file.buffer, mimeType: req.file.mimetype });
    res.json({ success: true, data });
  })
);

router.patch(
  '/objects/rename',
  asyncHandler(async (req, res) => {
    const { sourceKey, targetKey } = renameSchema.parse(req.body);
    const data = await renameObject(sourceKey, targetKey);
    res.json({ success: true, data });
  })
);

router.delete(
  '/objects',
  asyncHandler(async (req, res) => {
    const { key } = deleteSchema.parse(req.body);
    const data = await deleteObject(key);
    res.json({ success: true, data });
  })
);

router.get(
  '/objects/download-url',
  asyncHandler(async (req, res) => {
    const key = String(req.query.key || '');
    const signedUrl = await getSignedDownloadUrl(key);
    res.json({ success: true, data: { signedUrl } });
  })
);

router.get(
  '/analytics/storage',
  asyncHandler(async (_req, res) => {
    const data = await getBucketUsage();
    res.json({ success: true, data });
  })
);

export default router;
