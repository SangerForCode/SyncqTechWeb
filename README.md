# SyncqTechWeb

**Overview**
- **Purpose:** Static marketing site with a small Node/Express backend for handling careers applications (resume upload, application storage, and admin management).
- **Backend stack:** Node.js + Express, `multer` for uploads, `@aws-sdk/client-s3` for optional S3 storage, and a simple file-based data store.

**Architecture**
- **Entry point:** `backend/server.js` mounts routes and serves static resume files. See [backend/server.js](backend/server.js#L1).
- **Routes:** Application routes live in [backend/routes/apply.js](backend/routes/apply.js#L1) and admin routes in [backend/routes/admin.js](backend/routes/admin.js#L1).
- **Config modules:** S3 client in [backend/config/s3.js](backend/config/s3.js#L1) and JSON data store helper in [backend/config/db.js](backend/config/db.js#L1).

**Data flow (high level)**
- **Resume upload (`POST /api/careers/upload-resume`):**
	- Request: multipart/form-data with field `resume` (file) and form fields like `applicantName` and `role`.
	- Processing: file received in memory via `multer.memoryStorage()` (5MB limit). Server attempts to upload to AWS S3 using `backend/config/s3.js` if AWS env vars are configured. If S3 upload fails or is not configured, the server saves the file under `uploads/<role-folder>/` inside the project and serves it statically at `/uploads`.
	- Response: JSON with `fileUrl`, `fileName`, and `size`.

- **Application submit (`POST /api/careers/submit`):**
	- Request: JSON body with applicant fields. Required: `fullName`, `email`, `phone`, `college`, `role`, `resumeFileUrl`.
	- Processing: validated and persisted via `db.addApplicant()` into `data/applicants.json`.
	- Response: JSON confirming submission and returning the saved applicant object.

- **Admin endpoints:**
	- `POST /api/admin/login` returns a static token when correct credentials are provided (defaults or env vars).
	- Authenticated endpoints require `Authorization: Bearer <token>` and include fetching all applicants, updating applicant status, and downloading/resuming resumes via an authenticated proxy. See [backend/routes/admin.js](backend/routes/admin.js#L1).

**Key implementation details**
- **Role mapping:** Roles are normalized into folder names via a mapping in `apply.js` so resumes are organized by role.
- **Filename scheme:** `applicantName-role-YYYY-MM-DD-<timestamp>.<ext>` (slugified parts) to avoid collisions.
- **Local fallback:** If S3 is unavailable, files are written to `uploads/<role>/` and served statically by the server at `/uploads`.
- **Data persistence:** `backend/config/db.js` reads/writes `data/applicants.json`. The module creates the directory/file if missing.
- **Admin auth:** Simplistic static-token scheme (`syncq-admin-token-2026-auth`) returned by the login endpoint — not secure for production.
- **Resume download proxy:** Admin resumes are downloaded by the server (fetch upstream `resumeFileUrl`) and streamed to the admin client with proper headers.

**Environment variables**
- **AWS & storage:** `MY_AWS_region`, `MY_AWS_BUCKET_NAME`, `MY_AWS_ACCESS_KEY`, `MY_AWS_SECRET_KEY` — used by `backend/config/s3.js` and the upload flow.
- **Admin credentials:** `ADMIN_USERNAME`, `ADMIN_PASSWORD` (defaults are present in code; set env vars to override).
- **Server:** `PORT` overrides default port `5000`.

WARNING: Do not commit real secret keys. If you have a `.env` with AWS keys in this repo, rotate them immediately and remove the file from version control.

**How to run the backend locally**
1. Ensure Node.js (v18+ recommended for built-in `fetch`) is installed.
2. From repository root, run:

```bash
# set environment variables (or create a .env file)
PORT=5000 node backend/server.js
```

3. Endpoints will be available at `http://localhost:5000` (or configured `PORT`).

**Example requests**
- Upload resume (multipart):

```bash
curl -X POST "http://localhost:5000/api/careers/upload-resume" \
	-F "resume=@/path/to/resume.pdf" \
	-F "applicantName=Jane Doe" \
	-F "role=UI/UX"
```

- Submit application (JSON):

```bash
curl -X POST "http://localhost:5000/api/careers/submit" \
	-H "Content-Type: application/json" \
	-d '{"fullName":"Jane Doe","email":"jane@example.com","phone":"+911234567890","college":"X University","role":"UI/UX","resumeFileUrl":"http://localhost:5000/uploads/ui-ux/jane-...pdf"}'
```

- Admin login (returns static token):

```bash
curl -X POST "http://localhost:5000/api/admin/login" \
	-H "Content-Type: application/json" \
	-d '{"username":"admin","password":"syncqevents2026"}'
```

- Fetch applicants (authenticated):

```bash
curl -H "Authorization: Bearer syncq-admin-token-2026-auth" \
	"http://localhost:5000/api/admin/applicants"
```

**Caveats & recommendations**
- **Memory uploads:** `multer.memoryStorage()` holds files in RAM. For larger files or higher concurrency, stream uploads to disk or directly to S3.
- **Security:** Replace static admin token with a proper auth system (hashed passwords, JWTs, HTTPS). Limit admin endpoints with IP/rate limits.
- **Persistence:** Move from `data/applicants.json` to a real database (Postgres, MongoDB, or managed DB) for concurrency and reliability.
- **S3 permissions:** Use least-privilege IAM roles and avoid embedding long-lived credentials in `.env` files; prefer environment-specific secrets managers or IAM roles.
- **Node `fetch`:** If running Node <18, install `node-fetch` or use `axios` for upstream resume proxying.

If you'd like, I can:
- add a `npm` script for starting the backend;
- create a small `scripts/` health-check or a sample Postman collection;
- replace `multer.memoryStorage()` with a streaming upload to disk or direct S3 multipart upload.
