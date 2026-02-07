import { abortMultipart, completeMultipart, getMultipartPartUrl, getPresignedPut, initiateMultipart } from './api/s3Api';

const PART_SIZE = 10 * 1024 * 1024;

const saveState = (key, value) => localStorage.setItem(`multipart:${key}`, JSON.stringify(value));
const readState = (key) => {
  const state = localStorage.getItem(`multipart:${key}`);
  return state ? JSON.parse(state) : null;
};

export const directPutUpload = async ({ key, file, onProgress }) => {
  const { signedUrl } = await getPresignedPut(key, file.type || 'application/octet-stream');

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Direct upload failed due to network error'));
    xhr.send(file);
  });
};

export const multipartUploadWithResume = async ({ key, file, onProgress }) => {
  let state = readState(key);

  if (!state) {
    const init = await initiateMultipart(key, file.type || 'application/octet-stream');
    state = { uploadId: init.uploadId, parts: [] };
    saveState(key, state);
  }

  const totalParts = Math.ceil(file.size / PART_SIZE);

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (state.parts.find((p) => p.PartNumber === partNumber)) continue;

      const start = (partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const chunk = file.slice(start, end);

      const { signedUrl } = await getMultipartPartUrl(key, state.uploadId, partNumber);
      const uploadResponse = await fetch(signedUrl, { method: 'PUT', body: chunk });

      if (!uploadResponse.ok) {
        throw new Error(`Multipart upload failed at part ${partNumber}`);
      }

      const etag = uploadResponse.headers.get('ETag')?.replaceAll('"', '') || '';
      if (!etag) {
        throw new Error(`Missing ETag for uploaded part ${partNumber}`);
      }

      state.parts.push({ PartNumber: partNumber, ETag: etag });
      saveState(key, state);

      if (onProgress) {
        onProgress(Math.round((state.parts.length / totalParts) * 100));
      }
    }

    const orderedParts = state.parts.sort((a, b) => a.PartNumber - b.PartNumber);
    await completeMultipart(key, state.uploadId, orderedParts);
    localStorage.removeItem(`multipart:${key}`);
  } catch (error) {
    throw error;
  }
};
