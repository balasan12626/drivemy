# S3 Drive (Google Drive–like app with Node.js + React + AWS S3)

Production-ready starter for a Google Drive–style file manager backed by Amazon S3.

## What this includes
- Secure S3 connection using **AWS SDK v3** and `.env` credentials.
- Full S3 CRUD operations for files/folders.
- Folder explorer with breadcrumb navigation.
- Upload progress and folder upload via browser-to-S3 direct upload.
- Multipart upload endpoints and frontend resume logic for very large files.
- Storage analytics: used, remaining, capacity, bytes, file count.
- IAM least-privilege policy example.

## Project structure

```txt
/backend
  /src
    /config          # env loading + AWS client
    /middleware      # centralized error middleware
    /routes          # S3 API routes
    /services        # all S3 operations
    /utils           # validators + async wrapper
    server.js
/frontend
  /src
    /api             # axios client + API wrappers
    /components      # UI components
    /styles          # CSS
    App.jsx
    main.jsx
/infra
  iam-policy.json
.env.example
README.md
```

## Backend APIs
Base URL: `http://localhost:4000/api/s3`

- `GET /objects?prefix=` list folders/files
- `POST /folders` create folder
- `POST /upload/file` upload file
- `POST /upload/presigned-put` get pre-signed URL for direct browser upload
- `POST /upload/multipart/initiate` start multipart upload
- `GET /upload/multipart/part-url` get pre-signed part URL
- `POST /upload/multipart/complete` complete multipart upload
- `POST /upload/multipart/abort` abort multipart upload
- `GET /upload/multipart/active` list in-progress multipart uploads
- `PUT /objects/replace` replace existing file content
- `PATCH /objects/rename` rename/move object
- `DELETE /objects` delete file/folder recursively
- `GET /objects/download-url?key=` get signed download URL
- `GET /analytics/storage` usage metrics

## Setup

## 1) AWS
1. Create S3 bucket.
2. Create IAM user/programmatic access.
3. Attach policy from `infra/iam-policy.json` (replace bucket ARN).
4. Put credentials in `.env` (never commit real secrets).

## 2) Environment
Copy `.env.example` to `.env` in repository root.

```bash
cp .env.example .env
```

## 3) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 4) Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173`.

## Large file uploads (50–100GB)
- Backend provides multipart APIs using S3 Multipart Upload.
- Frontend performs direct browser-to-S3 uploads:
  - files >= 1GB use multipart upload with signed part URLs
  - files < 1GB use pre-signed PUT URL upload
- Progress is persisted in `localStorage` under key `multipart:<s3-key>`.
- If internet disconnects or page reloads, upload can continue from completed parts.

## Windows support
- Works on Windows 10/11 with Node 20+ and npm.
- Use PowerShell:
  - `Copy-Item .env.example .env`
  - Run backend/frontend commands exactly as above.

## Security best practices included
- Credentials loaded only from environment.
- Helmet + CORS on backend.
- Centralized error responses.
- Zod payload validation with structured 400 errors.
- Least-privilege IAM policy template.

## Notes
- S3 has no native folder entity; folder creation is implemented with a trailing-slash object key.
- Remaining storage is computed from `MAX_BUCKET_CAPACITY_GB` (logical quota configured by you).
