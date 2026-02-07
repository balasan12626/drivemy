import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  UploadPartCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client } from '../config/s3Client.js';
import { env } from '../config/env.js';

const bucket = env.AWS_S3_BUCKET;

const normalizePrefix = (prefix = '') => (prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix);

const listAllKeysByPrefix = async (prefix) => {
  let continuationToken;
  const keys = [];

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    );

    for (const item of response.Contents || []) {
      keys.push(item.Key);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
};

const deleteKeysInBatches = async (keys) => {
  let deleted = 0;

  for (let index = 0; index < keys.length; index += 1000) {
    const batch = keys.slice(index, index + 1000).map((key) => ({ Key: key }));
    if (!batch.length) continue;

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch }
      })
    );

    deleted += batch.length;
  }

  return deleted;
};

export const listObjects = async (prefix = '', continuationToken) => {
  const normalizedPrefix = normalizePrefix(prefix);

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
    Delimiter: '/',
    ContinuationToken: continuationToken,
    MaxKeys: 1000
  });

  const result = await s3Client.send(command);

  const folders = (result.CommonPrefixes || []).map((item) => ({
    type: 'folder',
    key: item.Prefix,
    name: item.Prefix.split('/').filter(Boolean).pop()
  }));

  const files = (result.Contents || [])
    .filter((item) => item.Key !== normalizedPrefix)
    .map((item) => ({
      type: 'file',
      key: item.Key,
      name: item.Key.split('/').pop(),
      size: item.Size,
      lastModified: item.LastModified
    }));

  return {
    items: [...folders, ...files],
    nextContinuationToken: result.NextContinuationToken || null,
    isTruncated: Boolean(result.IsTruncated)
  };
};

export const createFolder = async (path, folderName) => {
  const folderPath = normalizePrefix(path);
  const key = `${folderPath}${folderName.replace(/\/$/, '')}/`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: ''
    })
  );

  return { key };
};

export const uploadFile = async ({ key, fileBuffer, mimeType, onProgress }) => {
  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024
  });

  if (onProgress) {
    uploader.on('httpUploadProgress', onProgress);
  }

  await uploader.done();
  return { key };
};

export const getPresignedPutUrl = async ({ key, contentType }) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 15 });
  return { key, signedUrl };
};

export const initiateMultipartUpload = async ({ key, contentType }) => {
  const response = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    })
  );

  return { uploadId: response.UploadId, key: response.Key };
};

export const getMultipartSignedPartUrl = async ({ key, uploadId, partNumber }) => {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 15 });
  return { signedUrl };
};

export const completeMultipartUpload = async ({ key, uploadId, parts }) => {
  await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
      }
    })
  );

  return { key };
};

export const abortMultipartUpload = async ({ key, uploadId }) => {
  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId
    })
  );

  return { key, uploadId };
};

export const listMultipartUploads = async (prefix = '') => {
  const result = await s3Client.send(
    new ListMultipartUploadsCommand({
      Bucket: bucket,
      Prefix: normalizePrefix(prefix)
    })
  );

  return result.Uploads || [];
};

export const deleteObject = async (key) => {
  if (key.endsWith('/')) {
    const keys = await listAllKeysByPrefix(key);
    const deleted = await deleteKeysInBatches(keys);
    return { key, deleted };
  }

  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return { key, deleted: 1 };
};

export const renameObject = async (sourceKey, targetKey) => {
  if (sourceKey.endsWith('/')) {
    const keys = await listAllKeysByPrefix(sourceKey);

    for (const key of keys) {
      const copiedKey = key.replace(sourceKey, targetKey);
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: copiedKey
        })
      );
    }

    const moved = await deleteKeysInBatches(keys);
    return { sourceKey, targetKey, moved };
  }

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: targetKey
    })
  );

  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }));
  return { sourceKey, targetKey, moved: 1 };
};

export const replaceFile = async ({ key, fileBuffer, mimeType }) => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    })
  );

  return { key };
};

export const getSignedDownloadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
};

export const getBucketUsage = async () => {
  let continuationToken;
  let totalBytes = 0;
  let fileCount = 0;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    );

    for (const item of response.Contents || []) {
      if (!item.Key.endsWith('/')) {
        totalBytes += item.Size || 0;
        fileCount += 1;
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const usedStorageGB = totalBytes / 1024 / 1024 / 1024;
  const remainingStorageGB = Math.max(env.MAX_BUCKET_CAPACITY_GB - usedStorageGB, 0);

  return {
    totalBytes,
    usedStorageGB: Number(usedStorageGB.toFixed(2)),
    remainingStorageGB: Number(remainingStorageGB.toFixed(2)),
    maxCapacityGB: env.MAX_BUCKET_CAPACITY_GB,
    fileCount
  };
};
