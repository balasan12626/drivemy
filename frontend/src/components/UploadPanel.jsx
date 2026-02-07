import { directPutUpload, multipartUploadWithResume } from '../utils';

const MULTIPART_THRESHOLD_BYTES = 1024 * 1024 * 1024;

const uploadOne = async ({ key, file, setUploadProgress }) => {
  if (file.size >= MULTIPART_THRESHOLD_BYTES) {
    await multipartUploadWithResume({ key, file, onProgress: setUploadProgress });
  } else {
    await directPutUpload({ key, file, onProgress: setUploadProgress });
  }
};

export function UploadPanel({ currentPath, onUploaded, uploadProgress, setUploadProgress }) {
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const key = `${currentPath}${file.name}`;
    await uploadOne({ key, file, setUploadProgress });
    onUploaded();
  };

  const handleFolder = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    let completed = 0;

    for (const file of files) {
      const relative = file.webkitRelativePath || file.name;
      const key = `${currentPath}${relative}`;

      await uploadOne({
        key,
        file,
        setUploadProgress: (value) => {
          const aggregate = Math.round(((completed + value / 100) / files.length) * 100);
          setUploadProgress(aggregate);
        }
      });

      completed += 1;
      setUploadProgress(Math.round((completed / files.length) * 100));
    }

    onUploaded();
  };

  return (
    <section className="card">
      <h3>Upload</h3>
      <label>
        File:
        <input type="file" onChange={handleFile} />
      </label>
      <label>
        Folder:
        <input
          type="file"
          multiple
          onChange={handleFolder}
          ref={(node) => {
            if (node) {
              node.setAttribute('webkitdirectory', '');
              node.setAttribute('directory', '');
            }
          }}
        />
      </label>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
      </div>
      <p>{uploadProgress}%</p>
    </section>
  );
}
