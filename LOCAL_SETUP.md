# ResumeScore AI — Local Setup Guide

Three terminals. Everything runs locally. No AWS account needed.

---

## Prerequisites

Install these if you don't have them:

| Tool | Check | Install |
|---|---|---|
| Docker Desktop | `docker --version` | https://docs.docker.com/desktop/windows/ |
| Java 21 | `java -version` | https://adoptium.net (Eclipse Temurin 21) |
| Node.js 18+ | `node --version` | https://nodejs.org |

**Verify Java 21 specifically** — the backend requires Java 21:
```
java -version
# Should show: openjdk version "21.x.x" or similar
```

---

## Step 1 — Add your AI API key

Open `springboot-backend/.env` in any text editor and add your key:

```env
ACTIVE_AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Where to get keys:**
- Claude (recommended): https://console.anthropic.com → API Keys
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey
- OpenRouter (access all models): https://openrouter.ai/keys

You only need **one** key. Leave the others blank.

---

## Step 2 — Start Docker services (Postgres + MinIO)

Open **Terminal 1** in `springboot-backend/`:

```bash
cd "D:\Claude_Playground\Resume Scorer\springboot-backend"

docker compose up postgres minio minio-init -d
```

**Wait ~15 seconds**, then verify:
```bash
docker compose ps
```

You should see `postgres` and `minio` as **healthy**. If `minio-init` shows `exited (0)` — that's correct, it just creates the bucket and exits.

**MinIO console** (optional — view uploaded files):
→ http://localhost:9001
→ Login: `minioadmin` / `minioadmin`

---

## Step 3 — Run the Spring Boot backend

Open **Terminal 2** in `springboot-backend/`:

```bash
cd "D:\Claude_Playground\Resume Scorer\springboot-backend"

.\mvnw.cmd spring-boot:run
```

> **First run**: Maven downloads ~150 MB of dependencies. This takes 2–5 minutes. Subsequent starts are fast.

**Successful startup looks like:**
```
INFO  c.r.ResumeScorerApplication - Started ResumeScorerApplication in 3.4 seconds
```

**Verify it's running:**
```bash
curl http://localhost:8080/api/health
# Response: {"status":"ok"}
```

> **Flyway note**: On first run, Flyway automatically creates all 4 database tables. You'll see log lines like `Migrating schema "public" to version 1 - create users`.

---

## Step 4 — Set up Google Sign-In (for the web app login)

You need a Google OAuth client ID to test login. This takes 3 minutes:

1. Go to https://console.cloud.google.com
2. Create a project (or use existing)
3. APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
4. Application type: **Web application**
5. Authorised JavaScript origins: add `http://localhost:5173`
6. Authorised redirect URIs: add `http://localhost:5173`
7. Copy the **Client ID**

Then add it to two files:

**`springboot-backend/.env`:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**`web-app/.env.local`:**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Restart the Spring Boot server after editing `.env`.

> **Skip for now?** You can test the backend directly with curl (see Step 5) without setting up Google auth.

---

## Step 5 — Run the web app

Open **Terminal 3** in `web-app/`:

```bash
cd "D:\Claude_Playground\Resume Scorer\web-app"

npm install
npm run dev
```

Open → **http://localhost:5173**

---

## Testing without a browser (curl smoke tests)

These let you verify the backend works before setting up Google auth.

**Health check:**
```bash
curl http://localhost:8080/api/health
```

**Sign in (get a JWT):**
```bash
# First get a real Google ID token by signing in via the web app,
# then copy it from DevTools → Network → /api/auth/google → request body
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_GOOGLE_ID_TOKEN"}'
```

**Upload a resume (with JWT from above):**
```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/your_resume.pdf"
```

---

## What each service does

| Service | URL | Purpose |
|---|---|---|
| Spring Boot API | http://localhost:8080 | REST API + AI analysis |
| React web app | http://localhost:5173 | Browser UI |
| PostgreSQL | localhost:5432 | Database |
| MinIO (S3) | http://localhost:9000 | File storage (resume PDFs) |
| MinIO Console | http://localhost:9001 | Browse stored files |

---

## Troubleshooting

**`Error: JAVA_HOME not set` or `java version "11"`**
→ You need Java 21. Download from https://adoptium.net, install, then set JAVA_HOME:
```
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot"
```
Restart your terminal after setting it.

**`Flyway migration failed`**
→ Check PostgreSQL is running: `docker compose ps`
→ Check connection in `.env`: `DATABASE_URL=jdbc:postgresql://localhost:5432/resumescorer`

**`AI provider error`**
→ Check your API key in `.env` is correct and has credits
→ Check `ACTIVE_AI_PROVIDER` matches the key you provided

**`S3 upload failed`**
→ Make sure MinIO is running: `docker compose ps`
→ Verify the bucket exists: http://localhost:9001 → Buckets → `resumescorer-files`
→ If bucket missing: `docker compose up minio-init`

**Port already in use**
→ PostgreSQL: `netstat -ano | findstr :5432` → kill or change port in docker-compose
→ Spring Boot: `netstat -ano | findstr :8080` → change `server.port` in application.properties
→ Vite: `netstat -ano | findstr :5173` → runs on next free port automatically

**Stopping everything**
```bash
# Terminal 1 — stop Docker services
docker compose down

# Terminal 2 — Ctrl+C stops Spring Boot

# Terminal 3 — Ctrl+C stops Vite
```

**Nuke and restart from scratch (wipes database + MinIO data):**
```bash
docker compose down -v   # -v removes volumes (all data)
docker compose up postgres minio minio-init -d
```
