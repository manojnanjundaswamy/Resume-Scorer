# Local Setup Guide

This guide runs the current ResumeScore AI app locally on Windows using:

- `springboot-backend` for the Java/Spring Boot API
- `web-app` for the React/Vite UI
- Docker Compose for PostgreSQL and MinIO

## Prerequisites

Install these first:

| Tool | Check command | Required |
|---|---|---|
| Java | `java -version` | Java 21 |
| Docker Desktop | `docker --version` | Needed for PostgreSQL and MinIO |
| Node.js | `node --version` | Node 18 or newer |
| npm | `npm --version` | Comes with Node |
| Git | `git --version` | For source control |

## 1. Configure The Backend

Create a backend env file from the example:

```powershell
Copy-Item springboot-backend\.env.example springboot-backend\.env
```

Open `springboot-backend/.env` and review the values.

For the easiest first run, use mock AI:

```env
ACTIVE_AI_PROVIDER=MOCK
```

Mock mode returns deterministic test analysis and does not require a real AI API key.

For real AI analysis, set one provider and its key:

```env
ACTIVE_AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Other supported provider values:

```env
ACTIVE_AI_PROVIDER=GEMINI
GEMINI_API_KEY=your-gemini-api-key

ACTIVE_AI_PROVIDER=OPENAI
OPENAI_API_KEY=your-openai-api-key

ACTIVE_AI_PROVIDER=OPENROUTER
OPENROUTER_API_KEY=your-openrouter-api-key
```

Keep these local MinIO values for normal local development:

```env
S3_ENDPOINT=http://localhost:9000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=resumescorer-files
```

## 2. Configure The Web App

Create a frontend env file:

```powershell
Copy-Item web-app\.env.example web-app\.env.local
```

Open `web-app/.env.local` and set your Google OAuth client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_API_URL=
```

Leave `VITE_API_URL` empty for local dev. Vite proxies `/api` to `http://localhost:8080`.

## 3. Google Sign-In Setup

The web app login uses Google Identity Services. To create a local client ID:

1. Go to Google Cloud Console.
2. Open APIs and Services > Credentials.
3. Create OAuth client ID.
4. Choose Web application.
5. Add JavaScript origin: `http://localhost:5173`.
6. Add redirect URI: `http://localhost:5173`.
7. Copy the client ID into both env files:

```env
# springboot-backend/.env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# web-app/.env.local
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Restart the backend after changing `springboot-backend/.env`.

## 4. Start Infrastructure And Backend

From the repository root:

```powershell
.\start-local.ps1
```

The script checks Java, Docker, and Node, starts PostgreSQL and MinIO, then runs the Spring Boot API. Keep this terminal open.

Manual equivalent:

```powershell
cd springboot-backend
docker compose up postgres minio -d
.\start-local.ps1
```

Backend URL:

```text
http://localhost:8080
```

Health check:

```powershell
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 5. Start The Web App

Open a second terminal:

```powershell
cd web-app
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Proxy check:

```powershell
curl http://localhost:5173/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 6. First User Flow

1. Open `http://localhost:5173`.
2. Sign in with Google.
3. New users receive the configured welcome credits.
4. Upload a PDF, DOC, DOCX, or TXT resume up to 10 MB.
5. Optionally paste a job description.
6. Submit the analysis. It costs 1 credit.
7. View results and history.

## Supported Resume Files

| Format | Extensions | Notes |
|---|---|---|
| PDF | `.pdf` | Text PDFs only; scanned image PDFs need OCR first |
| Word | `.doc`, `.docx` | Parsed through Apache POI |
| Text | `.txt` | Parsed as UTF-8 text |

## Payment Setup

The app includes Razorpay credit purchase endpoints and a frontend top-up modal. For local testing of payments, set:

```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

Payment plans are served from:

```text
GET /api/payment/plans
```

You can still run analysis without Razorpay if users have free/welcome credits or you use the dev top-up endpoint with a valid JWT.

## Useful Commands

```powershell
# Backend build
cd springboot-backend
.\mvnw.cmd -q -DskipTests package

# Frontend build
cd web-app
npm run build

# Docker status
cd springboot-backend
docker compose ps

# Stop infrastructure
cd springboot-backend
docker compose down

# Stop and delete local database/storage volumes
cd springboot-backend
docker compose down -v
```

## Troubleshooting

### Port already in use

Check the process:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 8080,5173,5432,9000,9001 }
```

Default ports:

- Backend: `8080`
- Frontend: `5173`
- PostgreSQL: `5432`
- MinIO: `9000` and `9001`

### Backend cannot connect to database

Make sure Docker services are healthy:

```powershell
cd springboot-backend
docker compose ps
```

Check `springboot-backend/.env`:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/resumescorer
DATABASE_USERNAME=resumescorer
DATABASE_PASSWORD=resumescorer_dev
```

### S3 or upload errors

For local dev, make sure MinIO is running and these values are present:

```env
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=resumescorer-files
```

The backend creates the bucket on startup if it is missing.

### AI provider errors

Use mock mode first:

```env
ACTIVE_AI_PROVIDER=MOCK
```

If using a real provider, confirm that `ACTIVE_AI_PROVIDER` matches the key you configured.

### Google login fails

Check both files have the same OAuth client ID:

- `springboot-backend/.env`
- `web-app/.env.local`

Also confirm the Google OAuth client allows `http://localhost:5173` as a JavaScript origin.
