import { useEffect, useState } from 'react';
import {
  createFolder,
  deleteObject,
  getDownloadUrl,
  getStorage,
  listObjects,
  renameObject,
  replaceFile
} from './api/s3Api';
import { Breadcrumbs } from './components/Breadcrumbs';
import { FileTable } from './components/FileTable';
import { StorageStats } from './components/StorageStats';
import { UploadPanel } from './components/UploadPanel';

export default function App() {
  const [items, setItems] = useState([]);
  const [path, setPath] = useState('');
  const [stats, setStats] = useState({
    usedStorageGB: 0,
    remainingStorageGB: 0,
    maxCapacityGB: 0,
    totalBytes: 0,
    fileCount: 0
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const refresh = async (prefix = path) => {
    const [objectResponse, storageResponse] = await Promise.all([listObjects(prefix), getStorage()]);
    setItems(objectResponse.items);
    setStats(storageResponse);
    setUploadProgress(0);
  };

  useEffect(() => {
    refresh(path);
  }, [path]);

  const onCreateFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name) return;
    await createFolder(path, name);
    await refresh(path);
  };

  const onDelete = async (key) => {
    await deleteObject(key);
    await refresh(path);
  };

  const onRename = async (sourceKey, targetKey) => {
    await renameObject(sourceKey, targetKey);
    await refresh(path);
  };

  const onReplace = async () => {
    const key = window.prompt('Exact file key to replace');
    if (!key) return;

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      await replaceFile(key, file);
      await refresh(path);
    };
    picker.click();
  };

  const onDownload = async (key) => {
    const { signedUrl } = await getDownloadUrl(key);
    window.open(signedUrl, '_blank');
  };

  return (
    <main className="container">
      <h1>S3 Drive</h1>
      <StorageStats stats={stats} />
      <Breadcrumbs path={path} onNavigate={setPath} />

      <div className="toolbar">
        <button onClick={onCreateFolder}>Create Folder</button>
        <button onClick={onReplace}>Replace File</button>
      </div>

      <UploadPanel
        currentPath={path}
        onUploaded={() => refresh(path)}
        uploadProgress={uploadProgress}
        setUploadProgress={setUploadProgress}
      />

      <FileTable
        items={items}
        onOpenFolder={(key) => setPath(key)}
        onDelete={onDelete}
        onRename={onRename}
        onDownload={onDownload}
      />
    </main>
  );
}
