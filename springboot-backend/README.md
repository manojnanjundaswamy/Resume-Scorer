# ResumeScore AI Backend

Spring Boot backend for ResumeScore AI.

The API handles authentication, resume uploads, credit accounting, AI analysis orchestration, result history, local/remote file storage, and Razorpay credit purchases.

## Stack

| Area | Technology |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 3.3 |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Persistence | Spring Data JPA / Hibernate |
| Security | Spring Security, JJWT, Google/Apple token verification |
| AI providers | Claude, Gemini, OpenAI, OpenRouter, Mock |
| Resume parsing | PDFBox, Apache POI, plain text |
| Storage | AWS S3 SDK v2, MinIO for local dev |
| Payments | Razorpay |
| Build | Maven wrapper, Docker |

## Local Development

From the repository root, the recommended command is:

```powershell
.\start-local.ps1
```

From this folder only:

```powershell
Copy-Item .env.example .env
notepad .env

docker compose up postgres minio -d
.\start-local.ps1
```

The API starts at:

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

## Environment

Copy `.env.example` to `.env`. Do not commit `.env`.

Use mock AI for first-time setup:

```env
ACTIVE_AI_PROVIDER=MOCK
```

Use a real provider when ready:

```env
ACTIVE_AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Supported values:

| Value | Required key |
|---|---|
| `MOCK` | None |
| `CLAUDE` | `ANTHROPIC_API_KEY` |
| `GEMINI` | `GEMINI_API_KEY` |
| `OPENAI` | `OPENAI_API_KEY` |
| `OPENROUTER` | `OPENROUTER_API_KEY` |

For local MinIO storage, keep:

```env
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=resumescorer-files
```

## Docker Compose

For local development, run only infrastructure in Docker:

```powershell
docker compose up postgres minio -d
```

For full Docker mode, including the API image:

```powershell
docker compose --profile full up --build
```

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Liveness check |
| `GET` | `/actuator/health` | No | Spring actuator health |
| `POST` | `/api/auth/google` | No | Body: `{ "idToken": "..." }` |
| `POST` | `/api/auth/apple` | No | Body: `{ "identityToken": "...", "fullName": "..." }` |
| `GET` | `/api/users/me` | Bearer JWT | Current profile and credits |
| `POST` | `/api/analyze` | Bearer JWT | Multipart field `resume`, optional `jobDescription` |
| `GET` | `/api/results/{id}` | Bearer JWT | Fetch one stored analysis |
| `GET` | `/api/history` | Bearer JWT | Fetch user's analysis history |
| `POST` | `/api/credits/topup` | Bearer JWT | Dev/manual credit top-up |
| `GET` | `/api/payment/plans` | No | List credit purchase plans |
| `POST` | `/api/payment/create-order` | Bearer JWT | Create Razorpay order |
| `POST` | `/api/payment/verify` | Bearer JWT | Verify Razorpay payment and add credits |

### Resume Analysis Request

```powershell
curl -X POST http://localhost:8080/api/analyze `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -F "resume=@C:\path\to\resume.pdf" `
  -F "jobDescription=Optional pasted job description"
```

Supported upload types:

- `.pdf`
- `.doc`
- `.docx`
- `.txt`

Max upload size is configured in `application.properties` as 10 MB per file and 12 MB per request.

## Main Packages

```text
src/main/java/com/resumescorer/
|-- config/       # Security, CORS, S3, bucket initialization
|-- controller/   # Auth, analysis, user, payment APIs
|-- exception/    # API exceptions and global handler
|-- model/        # DTOs and JPA entities
|-- repository/   # Spring Data repositories
|-- security/     # JWT, current user resolver, OAuth token verifiers
`-- service/      # Analysis, credits, payments, parsing, storage, AI providers
```

Database migrations live in:

```text
src/main/resources/db/migration/
```

## Verification

```powershell
.\mvnw.cmd -q -DskipTests package
curl http://localhost:8080/api/health
```
