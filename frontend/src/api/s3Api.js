import { api } from './client';

export const listObjects = async (prefix = '') => (await api.get('/objects', { params: { prefix } })).data.data;
export const createFolder = async (path, folderName) => (await api.post('/folders', { path, folderName })).data.data;
export const deleteObject = async (key) => (await api.delete('/objects', { data: { key } })).data.data;
export const renameObject = async (sourceKey, targetKey) =>
  (await api.patch('/objects/rename', { sourceKey, targetKey })).data.data;
export const getStorage = async () => (await api.get('/analytics/storage')).data.data;
export const getDownloadUrl = async (key) => (await api.get('/objects/download-url', { params: { key } })).data.data;

export const uploadFile = async (key, file, onUploadProgress) => {
  const form = new FormData();
  form.append('key', key);
  form.append('file', file);
  return (await api.post('/upload/file', form, { onUploadProgress })).data.data;
};

export const replaceFile = async (key, file) => {
  const form = new FormData();
  form.append('key', key);
  form.append('file', file);
  return (await api.put('/objects/replace', form)).data.data;
};

export const getPresignedPut = async (key, contentType) =>
  (await api.post('/upload/presigned-put', { key, contentType })).data.data;

export const initiateMultipart = async (key, contentType) =>
  (await api.post('/upload/multipart/initiate', { key, contentType })).data.data;

export const getMultipartPartUrl = async (key, uploadId, partNumber) =>
  (await api.get('/upload/multipart/part-url', { params: { key, uploadId, partNumber } })).data.data;

export const completeMultipart = async (key, uploadId, parts) =>
  (await api.post('/upload/multipart/complete', { key, uploadId, parts })).data.data;

export const abortMultipart = async (key, uploadId) =>
  (await api.post('/upload/multipart/abort', { key, uploadId })).data.data;
