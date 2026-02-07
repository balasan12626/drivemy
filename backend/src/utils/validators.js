import { z } from 'zod';

const safeKey = z.string().min(1).refine((value) => !value.includes('..'), 'Key/path cannot contain ..');

export const listSchema = z.object({
  prefix: z.string().default(''),
  continuationToken: z.string().optional()
});

export const createFolderSchema = z.object({
  path: z.string().default(''),
  folderName: z.string().min(1)
});

export const deleteSchema = z.object({
  key: safeKey
});

export const renameSchema = z.object({
  sourceKey: safeKey,
  targetKey: safeKey
});

export const initiateMultipartSchema = z.object({
  key: safeKey,
  contentType: z.string().default('application/octet-stream')
});

export const multipartPartUrlSchema = z.object({
  key: safeKey,
  uploadId: z.string().min(1),
  partNumber: z.coerce.number().int().min(1).max(10000)
});

export const completeMultipartSchema = z.object({
  key: safeKey,
  uploadId: z.string().min(1),
  parts: z.array(z.object({ ETag: z.string().min(1), PartNumber: z.number().int().min(1).max(10000) })).min(1)
});

export const abortMultipartSchema = z.object({
  key: safeKey,
  uploadId: z.string().min(1)
});

export const presignedPutSchema = z.object({
  key: safeKey,
  contentType: z.string().default('application/octet-stream')
});
